const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  saveEvent, unsaveEvent, attendEvent, unattendEvent, getMyEvents, getEventStatus,
} = require('../controllers/userController');

const router = express.Router();

router.get('/me/events',              authenticate, getMyEvents);
router.get('/me/events/status/:id',   authenticate, getEventStatus);
router.post('/events/:id/save',       authenticate, saveEvent);
router.delete('/events/:id/save',     authenticate, unsaveEvent);
router.post('/events/:id/attend',     authenticate, attendEvent);
router.delete('/events/:id/attend',   authenticate, unattendEvent);

module.exports = router;
