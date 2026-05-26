const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');
const { askQuestion } = require('../utils/Chatbot');

async function reply(req, res) {
    const question = req.body?.question?.trim();

    if (!question) {
        throw new BadRequestError('Vui lòng nhập câu hỏi cho chatbot');
    }

    const metadata = await askQuestion(question);
    return new OK({
        message: 'Chatbot trả lời thành công',
        metadata,
    }).send(res);
}

module.exports = {
    reply,
};
