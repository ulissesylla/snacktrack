require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/database");
const routes = require("./routes");
const sessionMiddleware = require("./config/session");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const localRoutes = require("./routes/localRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const movimentacaoRoutes = require("./routes/movimentacaoRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const alertaRoutes = require("./routes/alertaRoutes");

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
app.use("/api/locais", localRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/movimentacoes", movimentacaoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alertas", alertaRoutes);

// Routes
app.use("/", routes);

// Export the app instance for testing
module.exports = app;

// Import the migration script
const { runMigrations } = require('./database/migrate');

// Start server after testing DB connection only if this file is run directly
if (require.main === module) {
  async function start() {
    try {
      // Try to listen on the specified port first
      const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${server.address().port}`);
      });
      
      // Then try to run database migrations
      // Use setTimeout to allow server to fully start before attempting migrations
      setTimeout(async () => {
        try {
          // Add a small delay to ensure database connection is ready
          await new Promise(resolve => setTimeout(resolve, 2000));
          await runMigrations();
          console.log("Database migrations completed successfully");
        } catch (migrationError) {
          console.warn("Database migrations failed:", migrationError.message);
          console.warn("Application will continue running but database may not be properly initialized");
        }
      }, 1000);
      
      // Handle the case where the port is already in use
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} is already in use. Trying another port...`);
          // Try a random available port
          server.listen(0, () => {
            console.log(`Server running on http://localhost:${server.address().port}`);
          });
        } else {
          throw err;
        }
      });
      
    } catch (err) {
      console.error("Failed to start application:", err.message || err);
      process.exit(1);
    }
  }

  start();
}