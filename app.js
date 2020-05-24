require("dotenv").config();
const { createCommentInIssue } = require("./services/githubApi");

const express = require("express");
const { createEventAdapter } = require("@slack/events-api");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const app = express();

// github stuff
const owner = process.env.GITHUB_OWNER_DEFAULT;
const repo = process.env.GITHUB_REPO_DEFAULT;
createCommentInIssue(owner, repo, 7, "**New Comment From Slack**");

//**** slack stuff

// Setup slack event listener
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

// Initialize WebClient
const { WebClient } = require("@slack/web-api");
// Read a token from the environment variables
const token = process.env.SLACK_BOT_TOKEN;
// Initialize
const web = new WebClient(token);

app.use("/slack/events", slackEvents.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let userCache = new Map();

const returnMessage = async (conversationId) => {
  const result = await web.chat.postMessage({
    text: "Your thread has been saved to Github ticket #xxxxxxx",
    channel: conversationId,
  });
  console.log(
    `Successfully send message ${result.ts} in conversation ${conversationId}`
  );
};

const getUserName = async (userId) => {
  // if userId in cache, then use cached value, else go ahead
  if (userId in userCache) {
    return userCache[userId];
  }
  const user = await web.users.profile.get({ token: token, user: userId });
  const userName = await user.profile.real_name;
  // now add to cache
  userCache.set(userId, userName);
  return userName;
};

// TODO
const searchAndReplaceUsernames = (text) => {
  const userNameRegex = /<@[a-zA-Z0-9]+>/g;
};

const getReplies = async (channelId, threadTs) => {
  const result = await web.conversations.replies({
    token: token,
    channel: channelId,
    ts: threadTs,
  });

  const messages = result.messages;
  const messagesArray = messages.map(async (message) => {
    const userRealName = await getUserName(message.user);
    const messageObj = {
      text: message.text,
      user: userRealName,
      ts: message.ts,
      thread_ts: message.thread_ts,
    };
    return messageObj;
  });
  return Promise.all(messagesArray);
};

const getParent = async (channelId, threadTs) => {
  try {
    const result = await web.conversations.replies({
      token: token,
      channel: channelId,
      ts: threadTs,
    });
    const parentThread = result.messages[0] && result.messages[0].thread_ts;
    return parentThread;
  } catch (e) {
    console.log(e);
  }
};

// When the bot is mentioned:
// 1. Check if commands are correct
//    a. if correct, then continue
//    b. else bot returns error
// 2. Parse the message text to get:
//    a. The command (add)
//    b. Github ticket id
//    ie. "add to #17200"
// 3. Submit to github

const parseCommands = (commandText) => {
  // 1. parse github id
  const githubIdRegex = /#([0-9])\w+/;
  const githubId =
    commandText.match(githubIdRegex) && commandText.match(githubIdRegex)[0];
  console.log("found: ", githubId);
};

slackEvents.on("app_mention", async (event) => {
  const conversationId = event.channel;
  console.log(
    `Received a message event: user ${event.user} in channel ${event.channel} in message number ${event.ts} says ${event.text}`
  );

  parseCommands(event.text);

  try {
    const parentThread = await getParent(conversationId, event.ts);
    const replies = await getReplies(conversationId, parentThread);
    console.log("Replies: ", replies);
  } catch (e) {
    console.log(e);
  }
});

// start server
app.listen(port, function () {
  console.log("Bot is listening on port " + port);
});
