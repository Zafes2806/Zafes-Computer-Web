const { connect } = require('../config/index');
const PcConfiguration = require('../models/pcConfiguration.model');
const {
    PC_CONFIGURATION_FIELDS,
    getPcConfigurationPayload,
    hasPcConfigurationValue,
} = require('../utils/pcConfiguration');

async function upsertPcConfiguration({ productId, source, transaction }) {
    const payload = getPcConfigurationPayload(source);

    const existingPcConfiguration = await PcConfiguration.findOne({
        where: { productId },
        transaction,
    });

    if (existingPcConfiguration) {
        await existingPcConfiguration.update(payload, { transaction });
    } else {
        await PcConfiguration.create(
            {
                productId,
                ...payload,
            },
            { transaction },
        );
    }

    return payload;
}

async function removePcConfiguration({ productId, transaction }) {
    await PcConfiguration.destroy({
        where: { productId },
        transaction,
    });
}

async function getExistingColumnNames(tableName, columnNames) {
    const placeholders = columnNames.map(() => '?').join(', ');
    const [rows] = await connect.query(
        `
            SELECT COLUMN_NAME AS columnName
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND COLUMN_NAME IN (${placeholders})
        `,
        {
            replacements: [tableName, ...columnNames],
        },
    );

    return rows.map((row) => row.columnName);
}

async function backfillLegacyPcConfigurations() {
    const existingColumns = await getExistingColumnNames('products', PC_CONFIGURATION_FIELDS);
    if (existingColumns.length !== PC_CONFIGURATION_FIELDS.length) {
        return;
    }

    const selectedColumns = PC_CONFIGURATION_FIELDS.map((field) => `\`${field}\``).join(', ');
    const hasValueCondition = PC_CONFIGURATION_FIELDS
        .map((field) => `NULLIF(TRIM(COALESCE(\`${field}\`, '')), '') IS NOT NULL`)
        .join(' OR ');

    const [legacyRows] = await connect.query(
        `
            SELECT id AS productId, ${selectedColumns}
            FROM products
            WHERE component_type = 'pc'
                AND (${hasValueCondition})
        `,
    );

    const records = legacyRows
        .map((row) => ({
            productId: row.productId,
            ...getPcConfigurationPayload(row),
        }))
        .filter((row) => hasPcConfigurationValue(row));

    if (!records.length) {
        return;
    }

    await PcConfiguration.bulkCreate(records, {
        updateOnDuplicate: [...PC_CONFIGURATION_FIELDS, 'updatedAt'],
    });
}

module.exports = {
    upsertPcConfiguration,
    removePcConfiguration,
    backfillLegacyPcConfigurations,
};
