function isForceDelete(req) {
    return req.query.force === true || req.query.force === 'true' || req.query.force === '1';
}

module.exports = {
    isForceDelete,
};
