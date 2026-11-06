const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const readSql = (filePath) => fs.readFileSync(filePath, 'utf8');

const initializeDatabase = async () => {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const migrationsPath = path.join(__dirname, '..', 'migrations');

  await db.query(readSql(schemaPath));

  const migrations = fs.readdirSync(migrationsPath)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const migration of migrations) {
    await db.query(readSql(path.join(migrationsPath, migration)));
    console.log(`[database] Applied ${migration}`);
  }
};

module.exports = { initializeDatabase };
