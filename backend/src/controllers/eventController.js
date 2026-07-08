const pool   = require('../config/db');
const path   = require('path');
const fs     = require('fs');

/* ─── helpers ─────────────────────────────────────────── */
const buildEventQuery = (filters, userLat, userLng) => {
  const { category, minPrice, maxPrice, search, radius = 20, dateFrom, dateTo } = filters;

  const distanceExpr = userLat && userLng
    ? `ST_Distance_Sphere(l.geom, ST_SRID(POINT(${+userLng}, ${+userLat}), 4326)) / 1000`
    : 'NULL';

  let sql = `
    SELECT
      e.id, e.title, e.description, e.date_time, e.category,
      e.price, e.capacity, e.image_url, e.status, e.created_at,
      l.id        AS location_id,
      l.address,
      l.latitude,
      l.longitude,
      u.id        AS organizer_id,
      u.username  AS organizer_name,
      (${distanceExpr})                                        AS distance_km,
      COUNT(DISTINCT CASE WHEN ue.type = 'attend' THEN ue.user_id END) AS attendee_count,
      COUNT(DISTINCT CASE WHEN ue.type = 'save'   THEN ue.user_id END) AS save_count
    FROM events e
    JOIN locations l ON e.location_id = l.id
    JOIN users    u ON e.organizer_id = u.id
    LEFT JOIN user_events ue ON ue.event_id = e.id
    WHERE e.status = 'published'
  `;

  const params = [];

  if (dateFrom) { sql += ' AND e.date_time >= ?';     params.push(dateFrom); }
  if (dateTo)   { sql += ' AND e.date_time <= ?';     params.push(dateTo); }
  if (userLat && userLng) {
    sql += ` AND ${distanceExpr} <= ?`;
    params.push(+radius);
  }
  if (category) { sql += ' AND e.category = ?';       params.push(category); }
  if (minPrice !== undefined) { sql += ' AND e.price >= ?'; params.push(+minPrice); }
  if (maxPrice !== undefined) { sql += ' AND e.price <= ?'; params.push(+maxPrice); }
  if (search)   { sql += ' AND (e.title LIKE ? OR e.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' GROUP BY e.id, l.id, u.id ORDER BY e.date_time ASC LIMIT 200';
  return { sql, params };
};

/* ─── GET /api/events ─────────────────────────────────── */
const getEvents = async (req, res) => {
  try {
    const { lat, lng, ...filters } = req.query;
    const { sql, params } = buildEventQuery(filters, lat, lng);
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── GET /api/events/:id ─────────────────────────────── */
const getEventById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, l.address, l.latitude, l.longitude,
              u.username AS organizer_name,
              COUNT(DISTINCT CASE WHEN ue.type='attend' THEN ue.user_id END) AS attendee_count,
              COUNT(DISTINCT CASE WHEN ue.type='save'   THEN ue.user_id END) AS save_count
       FROM events e
       JOIN locations l ON e.location_id = l.id
       JOIN users    u ON e.organizer_id = u.id
       LEFT JOIN user_events ue ON ue.event_id = e.id
       WHERE e.id = ?
       GROUP BY e.id, l.id, u.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getEventById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── POST /api/events  (organizer only) ──────────────── */
const createEvent = async (req, res) => {
  const { title, description, date_time, category, price = 0, capacity, address, latitude, longitude } = req.body;

  if (!title || !date_time || !category || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'title, date_time, category, address, latitude and longitude are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [locResult] = await conn.query(
      'INSERT INTO locations (address, latitude, longitude, geom) VALUES (?, ?, ?, ST_SRID(POINT(?, ?), 4326))',
      [address, +latitude, +longitude, +longitude, +latitude]
    );

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [evResult] = await conn.query(
      `INSERT INTO events (title, description, date_time, category, price, capacity, organizer_id, location_id, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, date_time, category, +price, capacity ? +capacity : null,
       req.user.id, locResult.insertId, imageUrl]
    );

    await conn.commit();
    res.status(201).json({ message: 'Event created', eventId: evResult.insertId });
  } catch (err) {
    await conn.rollback();
    console.error('createEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

/* ─── PUT /api/events/:id  (organizer, own event) ─────── */
const updateEvent = async (req, res) => {
  const { title, description, date_time, category, price, capacity, address, latitude, longitude, status } = req.body;

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    if (rows[0].organizer_id !== req.user.id) return res.status(403).json({ message: 'Not your event' });

    await conn.beginTransaction();

    if (address && latitude !== undefined && longitude !== undefined) {
      await conn.query(
        'UPDATE locations SET address=?, latitude=?, longitude=?, geom=ST_SRID(POINT(?,?),4326) WHERE id=?',
        [address, +latitude, +longitude, +longitude, +latitude, rows[0].location_id]
      );
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : rows[0].image_url;
    await conn.query(
      `UPDATE events SET title=?, description=?, date_time=?, category=?, price=?, capacity=?, image_url=?, status=?
       WHERE id=?`,
      [title ?? rows[0].title, description ?? rows[0].description, date_time ?? rows[0].date_time,
       category ?? rows[0].category, price !== undefined ? +price : rows[0].price,
       capacity !== undefined ? +capacity : rows[0].capacity, imageUrl,
       status ?? rows[0].status, req.params.id]
    );

    await conn.commit();
    res.json({ message: 'Event updated' });
  } catch (err) {
    await conn.rollback();
    console.error('updateEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

/* ─── DELETE /api/events/:id  (organizer, own event) ──── */
const deleteEvent = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT organizer_id, image_url FROM events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    if (rows[0].organizer_id !== req.user.id) return res.status(403).json({ message: 'Not your event' });

    if (rows[0].image_url) {
      const imgPath = path.join(__dirname, '../../', rows[0].image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── GET /api/events/organizer/me  ───────────────────── */
const getOrganizerEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, l.address, l.latitude, l.longitude,
              COUNT(DISTINCT CASE WHEN ue.type='attend' THEN ue.user_id END) AS attendee_count
       FROM events e
       JOIN locations l ON e.location_id = l.id
       LEFT JOIN user_events ue ON ue.event_id = e.id
       WHERE e.organizer_id = ?
       GROUP BY e.id, l.id
       ORDER BY e.date_time DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getOrganizerEvents error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getOrganizerEvents };
