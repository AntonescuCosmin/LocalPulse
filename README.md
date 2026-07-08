# LocalPulse

LocalPulse is a full-stack web platform for discovering local events around you. Users can browse events on an interactive map or in a list, filter by category, price, date and distance, save events, mark attendance, and organizers can create and manage their own events with image uploads.

## Features

- **Interactive map view** — events displayed on a Leaflet map with marker clustering and geolocation-based radius search (MySQL spatial queries with `ST_Distance_Sphere`)
- **List view with filters** — filter by category, price range, date range, distance and full-text search
- **Authentication** — JWT-based register/login with bcrypt password hashing and role support (user / organizer)
- **Event management** — organizers can create, update and delete events, including image upload (Multer)
- **User interactions** — save events for later, mark attendance, see attendee/save counts
- **Profile & dashboard** — personal dashboard with saved/attending events and organizer statistics

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, React-Leaflet (+ marker clustering), Axios |
| Backend  | Node.js, Express, MySQL (`mysql2`), JWT, bcryptjs, Multer |
| Database | MySQL 8 with spatial indexes (SRID 4326 POINT geometry) |

## Project Structure

```
localpulse/
├── backend/
│   ├── server.js              # Express entry point
│   └── src/
│       ├── config/db.js       # MySQL connection pool
│       ├── controllers/       # auth, events, users
│       ├── middleware/        # JWT auth, Multer upload
│       └── routes/            # /api/auth, /api/events, /api/users
└── frontend/
    └── src/
        ├── pages/             # Dashboard, MapView, ListView, EventDetail, Profile, Login, Register
        ├── components/        # Navbar, PrivateRoute
        ├── context/           # Auth context
        └── services/api.js    # Axios instance with JWT interceptor
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MySQL 8

### 1. Database

Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your MySQL credentials
npm run dev            # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/events` | List events (filters: category, price, date, radius, search) |
| GET | `/api/events/:id` | Event details |
| POST | `/api/events` | Create event (organizer, multipart with image) |
| PUT/DELETE | `/api/events/:id` | Update / delete own event |
| POST/DELETE | `/api/users/events/:id/save` | Save / unsave event |
| POST/DELETE | `/api/users/events/:id/attend` | Attend / unattend event |
| GET | `/api/users/my-events` | Saved & attending events |
