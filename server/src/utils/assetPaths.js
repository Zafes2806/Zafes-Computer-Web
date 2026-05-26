const UPLOADS_PREFIX = '/uploads/';

function normalizeUploadPath(value) {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return '';
    }

    const normalizedValue = trimmedValue.replace(/\\/g, '/');
    const uploadsIndex = normalizedValue.toLowerCase().indexOf(UPLOADS_PREFIX);

    if (uploadsIndex >= 0) {
        return normalizedValue.slice(uploadsIndex);
    }

    return trimmedValue;
}

function normalizeDelimitedUploadPaths(value) {
    if (typeof value !== 'string') {
        return value;
    }

    return value
        .split(',')
        .map((item) => normalizeUploadPath(item))
        .filter(Boolean)
        .join(',');
}

module.exports = {
    normalizeUploadPath,
    normalizeDelimitedUploadPaths,
};
