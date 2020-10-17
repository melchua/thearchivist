require("dotenv").config();
const {
  parseCommands,
  getParent,
  getReplies,
  returnMessage,
  replaceUsernames,
} = require("./services/slackAPI");
const { createCommentInIssue } = require("./services/githubApi");
const { formatThreadToString } = require("./utils/markdownFormatter");
const express = require("express");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const app = express();
const { createEventAdapter } = require("@slack/events-api");

// Setup slack event listener
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

app.use("/slack/events", slackEvents.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const owner = process.env.GITHUB_OWNER_DEFAULT;
const repo = process.env.GITHUB_REPO_DEFAULT;

slackEvents.on("app_mention", async (event) => {
  const channelId = event.channel;
  console.log(
    `Received a message event: user ${event.user} in channel ${event.channel} in message number ${event.ts} says ${event.text}`
  );

  const commandReceived = parseCommands(event.text);
  console.log("receive: ", commandReceived);

  // @CorgiBot #123 o:[owner] r:[repo] last:[number of messages back]
  try {
    const parentThread = await getParent(channelId, event.ts);
    console.log("parent", parentThread);
    if (parentThread) {
      let replies = await getReplies(channelId, parentThread);
      console.log("replies", replies);
      // filter replies - remove last reply as it is the corgi command
      replies = replies.slice(0,replies.length - 1);
      console.log("replies-strip end", replies);
      // filter replies - last x # of replies depending on request
      if (commandReceived.lastNumberOfMessages) {
        replies = replies.slice(replies.length - commandReceived.lastNumberOfMessages, replies.length);
      }
      console.log("replies after remove", replies);

      const bodyString = formatThreadToString(replies);
      const commentBody = await replaceUsernames(bodyString);
      createCommentInIssue(
        commandReceived.ownerName || owner,
        commandReceived.repoName || repo,
        commandReceived.issueId,
        commentBody
      );
      // returnMessage(channelId, "Success");
    } else {
      returnMessage(
        channelId,
        "Oops, you are possibly not on a thread. Please @mention the bot in a thread in order to add to an issue"
      );
    }
  } catch (e) {
    console.log(e);
  }
});

// testing

// (async function main() {
//   const test = await replaceUsernames(
//     "<@U013SU34KSP> We'll need to consult the AC. <@U013SU34KSP>"
//   );
//   console.log("test: ", test);
// })();

// start server
app.listen(port, function () {
  console.log("Bot is listening on port " + port);
});

// github stuff - slack bot should trigger this based on parametors
