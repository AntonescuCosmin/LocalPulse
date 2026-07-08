-- LocalPulse — MySQL schema
CREATE DATABASE IF NOT EXISTS localpulse_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE localpulse_db;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','organizer') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  address   VARCHAR(255) NOT NULL,
  latitude  DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom      POINT NOT NULL SRID 4326,
  SPATIAL INDEX idx_geom (geom)
);

CREATE TABLE events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  date_time    DATETIME NOT NULL,
  category     VARCHAR(50) NOT NULL,
  price        DECIMAL(8,2) DEFAULT 0,
  capacity     INT,
  image_url    VARCHAR(255),
  status       ENUM('published','draft','cancelled') NOT NULL DEFAULT 'published',
  organizer_id INT NOT NULL,
  location_id  INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (location_id)  REFERENCES locations(id) ON DELETE CASCADE
);

CREATE TABLE user_events (
  user_id    INT NOT NULL,
  event_id   INT NOT NULL,
  type       ENUM('save','attend') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, event_id, type),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
