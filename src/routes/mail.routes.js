/**
 * Router definition for mail reader endpoints.
 */

const express = require('express');
const { getUnreadStatus, getHealthStatus } = require('../controllers/mail.controller');

const router = express.Router();

router.get('/unread', getUnreadStatus);
router.get('/health', getHealthStatus);

module.exports = router;
