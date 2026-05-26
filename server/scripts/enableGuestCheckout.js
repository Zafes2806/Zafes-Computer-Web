const { connect } = require('../src/config/index');

async function enableGuestCheckout() {
    try {
        await connect.authenticate();

        await connect.query(`
            ALTER TABLE \`orders\`
            MODIFY COLUMN \`userId\` CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_bin
            NULL
        `);

        const [rows] = await connect.query(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'orders'
              AND COLUMN_NAME = 'userId'
        `);

        console.log('Guest checkout schema updated successfully.');
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Failed to enable guest checkout:', error.message || error);
        process.exitCode = 1;
    } finally {
        await connect.close();
    }
}

enableGuestCheckout();
