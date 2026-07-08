require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes  = require('./src/routes/auth');
const eventRoutes = require('./src/routes/events');
const userRoutes  = require('./src/routes/users');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',   authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users',  userRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`LocalPulse API running on http://localhost:${PORT}`));
