const mysql = require("mysql2/promise");
require("dotenv").config();

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    // Check if running on Railway or in production environment
    if (process.env.RAILWAY_DEPLOYMENT_ID || process.env.NODE_ENV === 'production') {
      // Use Railway's automatic environment variables
      const {
        MYSQL_HOST,
        MYSQL_PORT,
        MYSQL_USER,
        MYSQL_PASSWORD,
        MYSQL_DATABASE
      } = process.env;

      this.pool = mysql.createPool({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        port: Number(MYSQL_PORT),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { rejectUnauthorized: false } // For Railway connections
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

      this.pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: Number(DB_PORT),
        waitForConnections: true,
        connectionLimit: Number(DB_CONNECTION_LIMIT),
        queueLimit: 0,
      });
    }

    Database.instance = this;
    return this;
  }

  // Execute a query: returns [rows, fields]
  async query(sql, params = [], connection = null) {
    if (connection) {
      const [rows] = await connection.execute(sql, params);
      return rows;
    }
    const [rows] = await this.pool.execute(sql, params);
    return rows;
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
