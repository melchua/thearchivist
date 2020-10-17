const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

const auth = {
  id: process.env.GHAPP_ID,
  privateKey: process.env.PRIVATE_KEY,
  installationId: process.env.INSTALLATION_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
};

const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: auth,
});

const createCommentInIssue = async (owner, repo, issue_number, body) => {
  try {
    const result = await octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
  } catch (e) {
    console.log("error: ", e);
  }
};

module.exports = { createCommentInIssue: createCommentInIssue };
// might have to write a custom one for comments on PRs as I don't see one in Octokit
