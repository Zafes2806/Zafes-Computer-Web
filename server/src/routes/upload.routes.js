const express = require('express');

const uploadController = require('../controllers/upload.controller');
const { authAdmin } = require('../middleware/auth');
const { uploadMultipleImages, uploadSingleImage, verifyUploadedImages } = require('../middleware/upload');

const router = express.Router();

router.post('/single', authAdmin, uploadSingleImage, verifyUploadedImages, uploadController.handleSingleUpload);
router.post('/multiple', authAdmin, uploadMultipleImages, verifyUploadedImages, uploadController.handleMultipleUpload);

module.exports = router;
