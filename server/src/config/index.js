const { Sequelize } = require('sequelize');
const config = require('./env');

const connect = new Sequelize(config.database.name, config.database.user, config.database.password, {
    host: config.database.host,
    dialect: 'mysql',
    port: config.database.port,
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        underscored: true,
    },
});

const connectDB = async () => {
    try {
        await connect.authenticate();
        console.log('Connect Database Success!');
    } catch (error) {
        console.error('Database connection failed:', error.message || error);
        throw error;
    }
};

module.exports = { connectDB, connect };
