const express = require('express');
const { chat } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', protect, chat);

module.exports = router;
