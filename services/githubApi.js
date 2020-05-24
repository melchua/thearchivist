const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  userAgent: process.env.USER_AGENT,
});

const createCommentInIssue = async (owner, repo, issue_number, body) => {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
};

module.exports = { createCommentInIssue: createCommentInIssue };
// might have to write a custom one for comments on PRs as I don't see one in Octokit
