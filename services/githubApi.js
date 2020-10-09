//OLD for personal token
const { Octokit } = require("@octokit/rest");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");

// const auth = createOAuthAppAuth({
//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
// });

// async function githubAuth() {
//   const appAuthentication = await auth({
//     type: "oauth-app",
//   });
//   console.log("appAuth", appAuthentication.headers.authorization);
// }

// const oauthtoken = githubAuth().headers;

// Personal access token auth
// const octokit = new Octokit({
//   auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
//   userAgent: process.env.USER_AGENT,
// });

// Basic Auth
// const octokit = new Octokit({
// auth: oauthtoken,
// userAgent: process.env.USER_AGENT
// });

// createOAuthAppAuth?
const octokit = new Octokit({
  authStrategy: createOAuthAppAuth,
  auth: {
    clientId: process.env.CLIENT_ID,
    privateKey: process.env.PRIVATE_KEY,
  },
});

// async function test() {
//   const { data } = await octokit.request("/user");
//   console.log("data", data);
// }

// test();

const createCommentInIssue = async (owner, repo, issue_number, body) => {
  try {
    const result = await octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
    // console.log("result", result);
  } catch (e) {
    console.log("error: ", e);
  }
};

module.exports = { createCommentInIssue: createCommentInIssue };
// might have to write a custom one for comments on PRs as I don't see one in Octokit
