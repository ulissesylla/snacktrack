const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-secret";
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

module.exports = session({
  genid: () => uuidv4(),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true if using HTTPS
    maxAge: SESSION_MAX_AGE,
  },
});
