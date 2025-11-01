const express = require("express");
const path = require("path");

const router = express.Router();

router.get("/api/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

router.get("/", (req, res) => {
  // Serve the main frontend page
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = router;
