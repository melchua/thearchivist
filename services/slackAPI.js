// Initialize WebClient
const { WebClient } = require("@slack/web-api");
// Read a token from the environment variables
const token = process.env.SLACK_BOT_TOKEN;
// Initialize
const web = new WebClient(token);

let userCache = new Map();

const getUserName = async (userId) => {
  // if userId in cache, then use cached value, else go ahead
  if (userId in userCache) {
    return userCache[userId];
  }
  const user = await web.users.profile.get({ token: token, user: userId });
  const userName = await user.profile.real_name;

  userCache.set(userId, userName);
  return userName;
};

const findAllUsernames = async (messageText) => {
  const usernameRegex = /<@[a-zA-Z0-9]+>/g;
  const matches = messageText.match(usernameRegex);
  const userDir = matches.map(async (userId) => {
    const strippedUserId = userId.replace("<@", "").replace(">", "");
    const username = await getUserName(strippedUserId);
    return { userId: strippedUserId, username };
  });
  return Promise.all(userDir);
};

const replaceUsernames = async (messageText) => {
  const usernameDirectory = await findAllUsernames(messageText);
  let messageTextWithUsernames = messageText;
  usernameDirectory.forEach((user) => {
    messageTextWithUsernames = messageTextWithUsernames.replace(
      `<@${user.userId}>`,
      `@${user.username}`
    );
  });
  return messageTextWithUsernames;
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

const returnMessage = async (channelId, message) => {
  console.log("running error message");
  const result = await web.chat.postMessage({
    text: message,
    channel: channelId,
  });
  console.log(
    `Successfully send message ${result.ts} in conversation ${channelId}`
  );
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

const parseCommands = (commandText) => {
  // 1. parse issue id
  const issueIdRegex = /#([0-9])+/;
  const ownerNameRegex = /o:([\w'-])+/;
  const repoNameRegex = /r:([\w'-])+/;
  const lastMessagesCountRegex = /last:([0-9])+/;

  const issueId =
    commandText.match(issueIdRegex) &&
    commandText.match(issueIdRegex)[0].substring(1);
  const ownerName =
    commandText.match(ownerNameRegex) &&
    commandText.match(ownerNameRegex)[0].substring(2);
  const repoName =
    commandText.match(repoNameRegex) &&
    commandText.match(repoNameRegex)[0].substring(2);
  const lastNumberOfMessages = 
    commandText.match(lastMessagesCountRegex) &&
    commandText.match(lastMessagesCountRegex)[0].substring(5);
  
  console.log("last number", lastNumberOfMessages);

  return { issueId: issueId, ownerName: ownerName, repoName: repoName, lastNumberOfMessages: lastNumberOfMessages};
};

module.exports = {
  parseCommands,
  getParent,
  getReplies,
  returnMessage,
  replaceUsernames,
  findAllUsernames,
};
