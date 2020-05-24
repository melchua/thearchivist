const formatMessageToString = (user, text) => {
  return `**${user}**\n ${text}`;
};

const formatThreadToString = (messageThreadData) => {
  let messageThreadFormatted = "";

  messageThreadData.forEach((message) => {
    const messageString = formatMessageToString(message.user, message.text);
    messageThreadFormatted += messageString;
    messageThreadFormatted += `\n\n`;
  });
  return messageThreadFormatted;
};

module.exports = { formatThreadToString };
