require("dotenv").config();
const express = require("express");
const { createEventAdapter } = require("@slack/events-api");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const app = express();

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

const returnMessage = async (conversationId) => {
  const result = await web.chat.postMessage({
    text: "I am alive@!!",
    channel: conversationId,
  });
  console.log(
    `Successfully send message ${result.ts} in conversation ${conversationId}`
  );
};

const getConversationHistory = async (channelId) => {
  const result = await web.conversations.history({
    token: token,
    channel: channelId,
  });
  console.log("History: ", result);
};

const getReplies = async (channelId, threadTs) => {
  const result = await web.conversations.replies({
    token: token,
    channel: channelId,
    ts: threadTs,
  });

  const messages = result.messages;
  console.log(`Replies for ${threadTs}: ${messages} `);

  const texts = messages.map((message) => {
    return message.text;
  });

  console.log("Texts: ", texts);
};

slackEvents.on("app_mention", async (event) => {
  const conversationId = event.channel;
  console.log(
    `Received a message event: user ${event.user} in channel ${event.channel} in message number ${event.ts} says ${event.text}`
  );
  // getConversationHistory(conversationId);
  returnMessage(conversationId);
  getReplies(conversationId, "1589695317.002000");
});

// start server
app.listen(port, function () {
  console.log("Bot is listening on port " + port);
});

// (async () => {
//   const server = await slackEvents.start(port);
//   console.log(`Listening for events on ${server.address().port}`);
// })();
