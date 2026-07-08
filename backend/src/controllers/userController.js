const pool = require('../config/db');

/* ─── POST /api/users/events/:id/save    ─── */
const saveEvent = async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO user_events (user_id, event_id, type) VALUES (?, ?, "save")',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Event saved' });
  } catch (err) {
    console.error('saveEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── DELETE /api/users/events/:id/save  ─── */
const unsaveEvent = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_events WHERE user_id=? AND event_id=? AND type="save"',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Event unsaved' });
  } catch (err) {
    console.error('unsaveEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── POST /api/users/events/:id/attend  ─── */
const attendEvent = async (req, res) => {
  try {
    const [[event]] = await pool.query(
      `SELECT e.capacity,
              COUNT(DISTINCT CASE WHEN ue.type = 'attend' THEN ue.user_id END) AS attendee_count
       FROM events e
       LEFT JOIN user_events ue ON ue.event_id = e.id
       WHERE e.id = ?
       GROUP BY e.id`,
      [req.params.id]
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.capacity !== null && event.attendee_count >= event.capacity) {
      return res.status(409).json({ message: 'Event is fully booked' });
    }
    await pool.query(
      'INSERT IGNORE INTO user_events (user_id, event_id, type) VALUES (?, ?, "attend")',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'RSVP confirmed' });
  } catch (err) {
    console.error('attendEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── DELETE /api/users/events/:id/attend ── */
const unattendEvent = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_events WHERE user_id=? AND event_id=? AND type="attend"',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'RSVP cancelled' });
  } catch (err) {
    console.error('unattendEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── GET /api/users/me/events  ─────────── */
const getMyEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, l.address, l.latitude, l.longitude,
              u.username AS organizer_name,
              ue.type    AS engagement_type
       FROM user_events ue
       JOIN events    e ON ue.event_id = e.id
       JOIN locations l ON e.location_id = l.id
       JOIN users     u ON e.organizer_id = u.id
       WHERE ue.user_id = ?
       ORDER BY ue.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getMyEvents error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── GET /api/users/me/events/status/:id  ─ */
const getEventStatus = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT type FROM user_events WHERE user_id=? AND event_id=?',
      [req.user.id, req.params.id]
    );
    const saved   = rows.some(r => r.type === 'save');
    const attending = rows.some(r => r.type === 'attend');
    res.json({ saved, attending });
  } catch (err) {
    console.error('getEventStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { saveEvent, unsaveEvent, attendEvent, unattendEvent, getMyEvents, getEventStatus };
