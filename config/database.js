const mysql = require("mysql2/promise");
require("dotenv").config();

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

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

    Database.instance = this;
    return this;
  }

  // Execute a query: returns [rows, fields]
  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  // Optional: get raw pool
  getPool() {
    return this.pool;
  }
}

module.exports = new Database();
