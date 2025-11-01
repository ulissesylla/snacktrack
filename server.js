require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/database");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", routes);

// Start server after testing DB connection
async function start() {
  try {
    // quick test query (doesn't require any tables)
    await db.query("SELECT 1");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start application:", err.message || err);
    process.exit(1);
  }
}

start();
