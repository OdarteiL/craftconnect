const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'craftconnect',
  process.env.DB_USER || 'craftconnect',
  process.env.DB_PASSWORD || 'craftconnect_secret',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function testConnection() {
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL connected');
      return;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('❌ PostgreSQL connection failed:', err.message);
        throw err;
      }
      console.warn(`⚠️  PostgreSQL connection attempt failed, retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

module.exports = { sequelize, testConnection };
