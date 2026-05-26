const { Op } = require('sequelize');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const config = require('../config/env');
const genAI = config.chatbot.isConfigured ? new GoogleGenerativeAI(config.chatbot.apiKey) : null;
const model = genAI
    ? genAI.getGenerativeModel({
        model: config.chatbot.modelName,
        generationConfig: {
            maxOutputTokens: 700,
            temperature: 0.4,
            thinkingConfig: {
                thinkingBudget: 0,
            },
        },
    })
    : null;

const modelProduct = require('../models/products.model');
const { PRODUCT_STATUS } = require('../constants/productStatus');
const MAX_PRODUCTS_IN_PROMPT = 35;
const MAX_RECOMMENDED_PRODUCTS = 3;

async function askQuestion(question) {
    try {
        const products = await modelProduct.findAll({
            where: {
                status: {
                    [Op.or]: [PRODUCT_STATUS.ACTIVE, null],
                },
            },
        });
        const relevantProducts = selectRelevantProducts(products, question);

        if (isBuildAdviceIntent(question)) {
            return {
                reply: 'Để tư vấn build PC phù hợp, bạn cho mình biết ngân sách dự kiến và nhu cầu chính nhé. Ví dụ: chơi game, học tập, làm đồ họa hay làm văn phòng.',
                products: [],
            };
        }

        const recommendedProducts = shouldShowProductCards(question)
            ? relevantProducts.slice(0, MAX_RECOMMENDED_PRODUCTS)
            : [];

        if (recommendedProducts.length > 0) {
            return {
                reply: buildProductSuggestionReply(question, recommendedProducts),
                products: recommendedProducts.map(toChatbotProduct),
            };
        }

        if (!model) {
            return {
                reply: 'Chatbot chưa được cấu hình. Vui lòng thêm GOOGLE_AI_KEY vào file .env của server.',
                products: [],
            };
        }

        const productData = relevantProducts
            .map(
                (product) =>
                    `- ${product.name} | Giá: ${formatPrice(getSalePrice(product))}`,
            )
            .join('\n');

        const prompt = `
        Bạn là trợ lý bán hàng của shop PC.

        Quy tắc trả lời:
        - Trả lời bằng tiếng Việt, ngắn gọn, dễ đọc trong khung chat nhỏ.
        - Từ 40 đến 120 từ cho câu trả lời thông thường.
        - Nếu giới thiệu sản phẩm, chỉ chọn tối đa 3 sản phẩm phù hợp nhất.
        - Nếu câu hỏi là tìm/gợi ý sản phẩm, trả lời ngắn rằng shop có vài mẫu phù hợp và mời khách xem các gợi ý bên dưới; không cần liệt kê lại đầy đủ tên sản phẩm.
        - Không dùng markdown như **, ###, bảng, hoặc emoji.
        - Không bịa thông tin ngoài danh sách sản phẩm.
        - Kết thúc bằng 1 câu hỏi ngắn để hỏi thêm nhu cầu hoặc ngân sách.

        Danh sách sản phẩm hiện có:
        ${productData}

        Câu hỏi của khách hàng: ${question}
        `;

        const result = await model.generateContent(prompt);
        return {
            reply: result.response.text(),
            products: [],
        };
    } catch (error) {
        console.error('Chatbot error:', error);
        return {
            reply: 'Chatbot tạm thời không phản hồi. Vui lòng thử lại sau.',
            products: [],
        };
    }
}

function getSalePrice(product) {
    const price = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;

    return discount > 0 ? price - (price * discount) / 100 : price;
}

function formatPrice(value) {
    return `${Math.round(value).toLocaleString('vi-VN')} VNĐ`;
}

function toChatbotProduct(product) {
    return {
        id: product.id,
        name: product.name,
        price: getSalePrice(product),
        formattedPrice: formatPrice(getSalePrice(product)),
        image: getFirstImage(product.images),
    };
}

function getFirstImage(images) {
    if (typeof images !== 'string') {
        return '';
    }

    const [firstImage] = images.split(',');
    return firstImage?.trim() || '';
}

function shouldShowProductCards(question) {
    const normalizedQuestion = normalizeText(question);
    return [
        'pc',
        'gaming',
        'máy',
        'may',
        'sản phẩm',
        'san pham',
        'cấu hình',
        'cau hinh',
        'linh kiện',
        'linh kien',
        'mua',
        'giá',
        'gia',
        'rtx',
        'gtx',
        'ryzen',
        'intel',
        'i3',
        'i5',
        'i7',
        'triệu',
        'trieu',
        'tr',
    ].some((keyword) => normalizedQuestion.includes(keyword));
}

function selectRelevantProducts(products, question) {
    const normalizedQuestion = normalizeText(question);
    const budget = parseBudget(normalizedQuestion);
    const questionTokens = normalizedQuestion
        .split(/\s+/)
        .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ''))
        .filter((token) => token.length >= 3 && !COMMON_SEARCH_WORDS.has(token));

    const scoredProducts = products.map((product, index) => {
        const normalizedName = normalizeText(product.name);
        const salePrice = getSalePrice(product);
        let score = 0;

        if (budget.maxPrice && salePrice > budget.maxPrice) {
            score -= 30;
        }

        if (budget.minPrice && salePrice < budget.minPrice) {
            score -= 10;
        }

        questionTokens.forEach((token) => {
            if (normalizedName.includes(token)) {
                score += 2;
            }
        });

        if (normalizedQuestion.includes('gaming') && normalizedName.includes('gaming')) {
            score += 8;
        }

        if (normalizedQuestion.includes('gaming') && !normalizedName.includes('gaming')) {
            score -= 30;
        }

        if (/(văn phòng|van phong|office)/.test(normalizedQuestion) && /(văn phòng|van phong|office)/.test(normalizedName)) {
            score += 8;
        }

        if (normalizedQuestion.includes('pc') && normalizedName.includes('pc')) {
            score += 4;
        }

        if (normalizedQuestion.includes('pc')) {
            score += product.componentType === 'pc' ? 20 : -30;
        }

        if (/(rtx|gtx|rx|ryzen|intel|core)\b/.test(normalizedQuestion) && /(rtx|gtx|rx|ryzen|intel|core)\b/.test(normalizedName)) {
            score += 4;
        }

        if (budget.maxPrice && salePrice <= budget.maxPrice) {
            score += 5;
        }

        return { product, score, index, salePrice };
    });

    const matchedItems = scoredProducts
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.salePrice - b.salePrice || a.index - b.index);

    const budgetMatchedItems = budget.maxPrice
        ? matchedItems.filter((item) => item.salePrice <= budget.maxPrice)
        : [];

    const matchedProducts = (budgetMatchedItems.length > 0 ? budgetMatchedItems : matchedItems)
        .map((item) => item.product);

    return (matchedProducts.length > 0 ? matchedProducts : products).slice(0, MAX_PRODUCTS_IN_PROMPT);
}

function normalizeText(value) {
    return String(value || '').toLowerCase();
}

function buildProductSuggestionReply(question, products = []) {
    const normalizedQuestion = normalizeText(question);
    const hasBudget = Boolean(parseBudget(normalizedQuestion).maxPrice);
    const productCountText = products.length > 1 ? 'một vài' : 'một';

    if (normalizedQuestion.includes('gaming')) {
        return hasBudget
            ? `Shop có ${productCountText} mẫu PC gaming hợp ngân sách, mình để gợi ý bên dưới để bạn xem ảnh, giá và bấm vào chi tiết sản phẩm. Bạn thường chơi game gì?`
            : `Shop có ${productCountText} mẫu PC gaming phù hợp, mình để gợi ý bên dưới để bạn xem ảnh, giá và bấm vào chi tiết sản phẩm. Bạn có ngân sách khoảng bao nhiêu và thường chơi game gì?`;
    }

    if (/(văn phòng|van phong|office)/.test(normalizedQuestion)) {
        return hasBudget
            ? `Mình tìm thấy ${productCountText} mẫu PC văn phòng hợp ngân sách, bạn xem các gợi ý bên dưới nhé. Bạn cần máy cho Word, Excel hay phần mềm nào khác?`
            : `Mình tìm thấy ${productCountText} mẫu PC văn phòng phù hợp, bạn xem các gợi ý bên dưới nhé. Bạn muốn ưu tiên tiết kiệm hay chạy đa nhiệm mượt hơn?`;
    }

    return 'Mình tìm thấy một vài sản phẩm phù hợp, bạn xem các gợi ý bên dưới để xem ảnh, giá và bấm vào chi tiết sản phẩm. Bạn muốn ưu tiên ngân sách hay hiệu năng?';
}

function parseBudget(normalizedQuestion) {
    const compactQuestion = normalizedQuestion.replace(/,/g, '.');
    const numberMatch = compactQuestion.match(/(\d+(?:\.\d+)?)\s*(triệu|trieu|tr|m|k|nghìn|ngan|ngàn)?/);

    if (!numberMatch) {
        return {};
    }

    const rawNumber = Number(numberMatch[1]);
    const unit = numberMatch[2] || '';

    if (!unit && rawNumber >= 1000) {
        return {};
    }

    if (!unit && !/(giá|gia|ngân sách|ngan sach|dưới|duoi|khoảng|khoang|tầm|tam|trên|tren|từ|tu)/.test(compactQuestion)) {
        return {};
    }

    let amount = rawNumber;

    if (['triệu', 'trieu', 'tr', 'm'].includes(unit)) {
        amount = rawNumber * 1000000;
    } else if (['k', 'nghìn', 'ngan', 'ngàn'].includes(unit)) {
        amount = rawNumber * 1000;
    } else if (rawNumber < 1000) {
        amount = rawNumber * 1000000;
    }

    if (/(dưới|duoi|không quá|khong qua|tối đa|toi da|<=|ít hơn|it hon)/.test(compactQuestion)) {
        return { maxPrice: amount };
    }

    if (/(trên|tren|từ|tu|>=|hơn|hon)/.test(compactQuestion)) {
        return { minPrice: amount };
    }

    if (/(khoảng|khoang|tầm|tam)/.test(compactQuestion)) {
        return {
            minPrice: amount * 0.85,
            maxPrice: amount * 1.15,
        };
    }

    return { maxPrice: amount };
}

function isBuildAdviceIntent(question) {
    const normalizedQuestion = normalizeText(question);
    return /(tư vấn|tu van|build|lắp|lap)/.test(normalizedQuestion)
        && normalizedQuestion.includes('pc')
        && !parseBudget(normalizedQuestion).maxPrice
        && !/(rtx|gtx|rx|gaming|văn phòng|van phong)/.test(normalizedQuestion);
}

const COMMON_SEARCH_WORDS = new Set([
    'shop',
    'mình',
    'minh',
    'bên',
    'ben',
    'đang',
    'dang',
    'hiện',
    'hien',
    'nào',
    'nao',
    'dưới',
    'duoi',
    'khoảng',
    'khoang',
    'tầm',
    'tam',
    'triệu',
    'trieu',
    'cho',
    'có',
    'không',
    'khong',
]);

module.exports = { askQuestion };
