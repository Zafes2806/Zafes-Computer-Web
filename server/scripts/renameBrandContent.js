const { Op } = require('sequelize');

const { connect } = require('../src/config');
const Product = require('../src/models/products.model');
const Blog = require('../src/models/blogs.model');

const BRAND_NAME = 'Zafes Computer';

const replacements = [
    [/\bPC MARKET\b/g, BRAND_NAME],
    [/\bPCMarket\b/g, BRAND_NAME],
    [/\bPCMs\b/g, BRAND_NAME],
    [/\bPCM\b/g, BRAND_NAME],
    [/\bShop PC\b/g, BRAND_NAME],
    [/\bshop pc\b/g, BRAND_NAME],
    [/\bShop-PC\b/g, BRAND_NAME],
    [/\bshop-pc\b/g, BRAND_NAME],
];

function renameBrandText(value) {
    if (typeof value !== 'string') {
        return value;
    }

    return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

async function updateRows(model, fields, where) {
    const rows = await model.findAll({ where, paranoid: false });
    let updated = 0;

    for (const row of rows) {
        let changed = false;

        for (const field of fields) {
            const currentValue = row.get(field);
            const nextValue = renameBrandText(currentValue);

            if (nextValue !== currentValue) {
                row.set(field, nextValue);
                changed = true;
            }
        }

        if (changed) {
            await row.save({ hooks: false, silent: true });
            updated += 1;
        }
    }

    return updated;
}

async function main() {
    await connect.authenticate();

    const brandPatterns = ['%PC MARKET%', '%PCMarket%', '%PCMs%', '%PCM%', '%Shop PC%', '%shop pc%', '%Shop-PC%', '%shop-pc%'];
    const productWhere = {
        [Op.or]: brandPatterns.map((pattern) => ({
            description: {
                [Op.like]: pattern,
            },
        })),
    };
    const blogWhere = {
        [Op.or]: brandPatterns.flatMap((pattern) => [
            {
                title: {
                    [Op.like]: pattern,
                },
            },
            {
                content: {
                    [Op.like]: pattern,
                },
            },
        ]),
    };

    const productsUpdated = await updateRows(Product, ['description'], productWhere);
    const blogsUpdated = await updateRows(Blog, ['title', 'content'], blogWhere);

    console.log(`Updated product rows: ${productsUpdated}`);
    console.log(`Updated blog rows: ${blogsUpdated}`);
}

main()
    .catch((error) => {
        console.error('Failed to rename brand content:', error.message || error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await connect.close();
    });
