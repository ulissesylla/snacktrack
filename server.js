require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/database");
const routes = require("./routes");
const sessionMiddleware = require("./config/session");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// sessions (must be used before routes)
app.use(sessionMiddleware);

// auth & user routes
app.use(authRoutes);
app.use("/api/usuarios", userRoutes);

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
