const { connect } = require('../src/config/index');

async function enableOrderItemSnapshots() {
    try {
        await connect.authenticate();

        const [existingColumns] = await connect.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'order_items'
              AND COLUMN_NAME = 'productSnapshot'
        `);

        if (!existingColumns.length) {
            await connect.query(`
                ALTER TABLE \`order_items\`
                ADD COLUMN \`productSnapshot\` JSON NULL AFTER \`productImage\`
            `);
        }

        const [rows] = await connect.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'order_items'
              AND COLUMN_NAME = 'productSnapshot'
        `);

        console.log('Order item snapshot schema is ready.');
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Failed to enable order item snapshots:', error.message || error);
        process.exitCode = 1;
    } finally {
        await connect.close();
    }
}

enableOrderItemSnapshots();
