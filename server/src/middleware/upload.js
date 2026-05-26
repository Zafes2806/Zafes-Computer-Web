const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { BadRequestError } = require('../core/error.response');

const uploadDirectory = path.resolve(__dirname, '../uploads/images');
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxUploadFileSizeBytes = 5 * 1024 * 1024;
const imageExtensionByMimeType = {
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

fs.mkdirSync(uploadDirectory, { recursive: true });

async function removeFileIfExists(filePath) {
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

function getDetectedImageMimeType(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
    }

    if (
        buffer.length >= 8
        && buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47
        && buffer[4] === 0x0d
        && buffer[5] === 0x0a
        && buffer[6] === 0x1a
        && buffer[7] === 0x0a
    ) {
        return 'image/png';
    }

    const header = buffer.subarray(0, 6).toString('ascii');
    if (header === 'GIF87a' || header === 'GIF89a') {
        return 'image/gif';
    }

    if (
        buffer.length >= 12
        && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'image/webp';
    }

    return null;
}

async function verifyAndFinalizeUploadedFile(file) {
    const fileHandle = await fs.promises.open(file.path, 'r');
    let detectedMimeType = null;

    try {
        const signatureBuffer = Buffer.alloc(16);
        const { bytesRead } = await fileHandle.read(signatureBuffer, 0, signatureBuffer.length, 0);
        detectedMimeType = getDetectedImageMimeType(signatureBuffer.subarray(0, bytesRead));
    } finally {
        await fileHandle.close();
    }

    if (!detectedMimeType || !allowedImageMimeTypes.has(detectedMimeType)) {
        await removeFileIfExists(file.path);
        throw new BadRequestError('File tải lên không phải ảnh hợp lệ');
    }

    if (file.mimetype !== detectedMimeType) {
        await removeFileIfExists(file.path);
        throw new BadRequestError('Định dạng ảnh không khớp với nội dung file');
    }

    const finalizedPath = path.join(uploadDirectory, `${crypto.randomUUID()}${imageExtensionByMimeType[detectedMimeType]}`);
    await fs.promises.rename(file.path, finalizedPath);

    file.path = finalizedPath;
    file.filename = path.basename(finalizedPath);
    file.mimetype = detectedMimeType;
}

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, uploadDirectory);
    },
    filename(req, file, callback) {
        callback(null, `${Date.now()}-${crypto.randomUUID()}.upload`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: maxUploadFileSizeBytes,
    },
    fileFilter(req, file, callback) {
        if (allowedImageMimeTypes.has(file.mimetype)) {
            callback(null, true);
            return;
        }

        callback(new BadRequestError('Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF'));
    },
});

function getUploadedFiles(req) {
    if (req.file) {
        return [req.file];
    }

    if (Array.isArray(req.files)) {
        return req.files;
    }

    return [];
}

function verifyUploadedImages(req, res, next) {
    const files = getUploadedFiles(req);

    Promise.all(files.map(verifyAndFinalizeUploadedFile))
        .then(() => next())
        .catch(async (error) => {
            await Promise.allSettled(getUploadedFiles(req).map((file) => removeFileIfExists(file.path)));
            next(error);
        });
}

module.exports = {
    uploadMultipleImages: upload.array('images', 10),
    uploadSingleImage: upload.single('image'),
    uploadDirectory,
    verifyUploadedImages,
};
