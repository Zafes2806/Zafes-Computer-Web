const express = require('express');

const chatbotController = require('../controllers/chatbot.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/replies', asyncHandler(chatbotController.reply));

module.exports = router;
