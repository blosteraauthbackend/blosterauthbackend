require('dotenv').config();
const { createClient } = require("@libsql/client");

if (!process.env.TURSO_USER_URL || !process.env.TURSO_USER_TOKEN) {
    console.error("❌ ERROR: TURSO_USER_URL ya TURSO_USER_TOKEN .env mein nahi hai!");
}

const userDB = createClient({
  url: process.env.TURSO_USER_URL,
  authToken: process.env.TURSO_USER_TOKEN,
});

const contentDB = createClient({
  url: process.env.TURSO_CONTENT_URL || process.env.TURSO_USER_URL,
  authToken: process.env.TURSO_CONTENT_TOKEN || process.env.TURSO_USER_TOKEN,
});

console.log("✅ Turso Clients Initialized!");

module.exports = { userDB, contentDB };