const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DATABASE_PATH || './database/news.db');

let db = null;

function getDatabase() {
  if (db) return db;

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      throw err;
    }
    console.log('Connected to SQLite database');
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

// Promisified database methods
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDatabase,
  run,
  get,
  all,
  close
};
