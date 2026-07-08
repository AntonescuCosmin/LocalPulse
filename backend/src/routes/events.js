const express = require('express');
const { authenticate, optionalAuth, requireOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent, getOrganizerEvents,
} = require('../controllers/eventController');

const router = express.Router();

router.get('/',                optionalAuth,                       getEvents);
router.get('/organizer/me',    authenticate, requireOrganizer,     getOrganizerEvents);
router.get('/:id',             optionalAuth,                       getEventById);
router.post('/',               authenticate, requireOrganizer, upload.single('image'), createEvent);
router.put('/:id',             authenticate, requireOrganizer, upload.single('image'), updateEvent);
router.delete('/:id',          authenticate, requireOrganizer,     deleteEvent);

module.exports = router;
