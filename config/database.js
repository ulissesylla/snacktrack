const mysql = require("mysql2/promise");
require("dotenv").config();

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    // Check if running on Railway or in production environment
    if (process.env.RAILWAY_DEPLOYMENT_ID || process.env.NODE_ENV === 'production') {
      let host, port, user, password, database;

      // Try Railway's specific variable names first
      if (process.env.MYSQLHOST && process.env.MYSQLPORT && process.env.MYSQLUSER && process.env.MYSQLPASSWORD && process.env.MYSQLDATABASE) {
        // Use Railway's actual environment variables
        host = process.env.MYSQLHOST;
        port = process.env.MYSQLPORT;
        user = process.env.MYSQLUSER;
        password = process.env.MYSQLPASSWORD;
        database = process.env.MYSQLDATABASE;
      } else if (process.env.DATABASE_URL) {
        // Alternative: Parse DATABASE_URL if available
        // Example: mysql://user:password@host:port/database
        const dbUrl = process.env.DATABASE_URL;
        const matches = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (matches) {
          user = matches[1];
          password = matches[2];
          host = matches[3];
          port = matches[4];
          database = matches[5];
        } else {
          throw new Error("Invalid DATABASE_URL format");
        }
      } else {
        // Fallback error if no database configuration is found
        console.error("No database configuration found!");
        console.error("Available env vars:", Object.keys(process.env).filter(key => key.includes('MYSQL') || key.includes('RAILWAY') || key.includes('DATABASE')));
        throw new Error("Database configuration missing");
      }

      console.log("Running in production/Railway environment");
      console.log("Database Host:", host);
      console.log("Database Port:", port);
      console.log("Database User:", user);
      console.log("Database Name:", database ? database : "NOT SET");

      this.pool = mysql.createPool({
        host: host,
        user: user,
        password: password,
        database: database,
        port: Number(port),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { rejectUnauthorized: false }, // For Railway connections
        // Add connection timeout to handle connection issues
        connectTimeout: 60000, // 60 seconds
        acquireTimeout: 60000, // 60 seconds
        timeout: 60000, // 60 seconds
      });
    } else {
      // Use local .env variables (for development)
      const {
        DB_HOST = "localhost",
        DB_USER = "root",
        DB_PASSWORD = "",
        DB_NAME = "snacktrack",
        DB_PORT = 3306,
        DB_CONNECTION_LIMIT = 10,
      } = process.env;

      console.log("Running in development environment");
      console.log("DB_HOST:", DB_HOST);
      console.log("DB_PORT:", DB_PORT);
      console.log("DB_USER:", DB_USER);
      console.log("DB_NAME:", DB_NAME);

      this.pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: Number(DB_PORT),
        waitForConnections: true,
        connectionLimit: Number(DB_CONNECTION_LIMIT),
        queueLimit: 0,
        connectTimeout: 60000, // 60 seconds
        acquireTimeout: 60000, // 60 seconds
        timeout: 60000, // 60 seconds
      });
    }

    Database.instance = this;
    return this;
  }

  // Execute a query: returns [rows, fields]
  async query(sql, params = [], connection = null) {
    try {
      if (connection) {
        const [rows] = await connection.execute(sql, params);
        return rows;
      }
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error(`Database query error: ${error.message}`);
      console.error(`SQL: ${sql}`);
      console.error(`Params: ${JSON.stringify(params)}`);
      throw error; // Re-throw the error to be handled by calling functions
    }
  }

  // Optional: get raw pool
  getPool() {
    return this.pool;
  }

  // Transaction helpers
  async beginTransaction() {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  async commit(connection) {
    if (!connection) return;
    try {
      await connection.commit();
    } finally {
      // release in any case
      try {
        connection.release();
      } catch (e) {
        /* ignore */
      }
    }
  }

  async rollback(connection) {
    if (!connection) return;
    try {
      await connection.rollback();
    } finally {
      try {
        connection.release();
      } catch (e) {
        /* ignore */
      }
    }
  }
}

module.exports = new Database();
