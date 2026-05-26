const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');

function handleSingleUpload(req, res) {
    if (!req.file) {
        throw new BadRequestError('Vui lòng chọn ảnh cần tải lên');
    }

    return new OK({
        message: 'Tải ảnh lên thành công',
        metadata: {
            image: `/uploads/images/${req.file.filename}`,
        },
    }).send(res);
}

function handleMultipleUpload(req, res) {
    if (!req.files || req.files.length === 0) {
        throw new BadRequestError('Vui lòng chọn ảnh cần tải lên');
    }

    return new OK({
        message: 'Tải nhiều ảnh lên thành công',
        metadata: {
            images: req.files.map((file) => `/uploads/images/${file.filename}`),
        },
    }).send(res);
}

module.exports = {
    handleMultipleUpload,
    handleSingleUpload,
};
