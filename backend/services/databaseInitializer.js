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

  const demoApartmentsPath = path.join(__dirname, '..', 'seeds', 'demo-apartments.json');
  const demoApartments = JSON.parse(readSql(demoApartmentsPath));
  for (const apartment of demoApartments) {
    await db.query(
      `INSERT INTO apartments
       (seed_key, title, description, city, address, price_per_night, cleaning_fee, service_fee,
        bedrooms, bathrooms, max_guests, images, amenities, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (seed_key) DO NOTHING`,
      [
        apartment.id, apartment.title, apartment.description, apartment.city, apartment.address,
        apartment.price_per_night, apartment.cleaning_fee, apartment.service_fee, apartment.bedrooms,
        apartment.bathrooms, apartment.max_guests, apartment.images || [], apartment.amenities || [],
        apartment.is_available !== false
      ]
    );
  }
  console.log(`[database] Ensured ${demoApartments.length} demo listings are bookable.`);
};

module.exports = { initializeDatabase };
