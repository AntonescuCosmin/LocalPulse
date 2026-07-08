import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

/* ── category config ────────────────────────────────────── */
const CATEGORIES = [
  { value: 'music',     label: 'Music',     color: '#7c3aed', emoji: '🎵' },
  { value: 'sports',    label: 'Sports',    color: '#059669', emoji: '⚽' },
  { value: 'workshops', label: 'Workshops', color: '#d97706', emoji: '🛠️' },
  { value: 'food',      label: 'Food',      color: '#dc2626', emoji: '🍕' },
  { value: 'art',       label: 'Art',       color: '#db2777', emoji: '🎨' },
  { value: 'tech',      label: 'Tech',      color: '#2563eb', emoji: '💻' },
  { value: 'other',     label: 'Other',     color: '#4b5563', emoji: '📅' },
];
const catMap   = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));
const colorOf  = (cat) => catMap[cat]?.color  ?? '#4b5563';
const emojiOf  = (cat) => catMap[cat]?.emoji  ?? '📅';

/* ── SVG pin marker (teardrop with emoji) ───────────────── */
const makePinIcon = (cat) => {
  const color = colorOf(cat);
  const emoji = emojiOf(cat);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
      </filter>
      <path filter="url(#s)"
        d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 26 14 26S32 26.5 32 16C32 8.268 25.732 2 18 2z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="15" r="8" fill="white" opacity="0.92"/>
      <text x="18" y="19" text-anchor="middle" font-size="10">${emoji}</text>
    </svg>`;
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:44px">${svg}</div>`,
    iconSize:    [36, 44],
    iconAnchor:  [18, 44],
    popupAnchor: [0, -46],
  });
};

/* ── user location dot ──────────────────────────────────── */
const userDotIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,0.3)"></div>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
});

/* ── fly to helper ──────────────────────────────────────── */
function FlyTo({ coords, zoom = 14 }) {
  const map  = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (coords && JSON.stringify(coords) !== JSON.stringify(prev.current)) {
      map.flyTo(coords, zoom, { duration: 1.2 });
      prev.current = coords;
    }
  }, [coords, zoom, map]);
  return null;
}

/* ── main component ─────────────────────────────────────── */
export default function MapView() {
  const navigate = useNavigate();
  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locating,   setLocating]   = useState(false);
  const [filters, setFilters] = useState({
    radius: 20, category: '', minPrice: '', maxPrice: '',
    search: '', dateFrom: '', dateTo: '',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (userCoords) { params.lat = userCoords[0]; params.lng = userCoords[1]; }
      Object.keys(params).forEach(k => (params[k] === '' || params[k] === null) && delete params[k]);
      const { data } = await api.get('/events', { params });
      setEvents(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, userCoords]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const locateMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserCoords([coords.latitude, coords.longitude]); setLocating(false); },
      ()           => { alert('Location access denied.'); setLocating(false); }
    );
  };

  const setFilter  = (name, value) => setFilters(f => ({ ...f, [name]: value }));
  const handleInput = (e) => setFilter(e.target.name, e.target.value);

  return (
    <div className="flex h-[calc(100vh-57px)]">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-10 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm tracking-wide">Filter Events</h2>
        </div>

        <div className="p-4 flex flex-col gap-5 flex-1">

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Keyword</label>
            <input name="search" value={filters.search} onChange={handleInput}
              placeholder="Search events…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          </div>

          {/* Radius + locate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Radius</label>
              <span className="text-sm font-bold text-blue-600">{filters.radius} km</span>
            </div>
            <input type="range" name="radius" min="1" max="50" value={filters.radius} onChange={handleInput}
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5 mb-2"><span>1 km</span><span>50 km</span></div>
            <button onClick={locateMe} disabled={locating}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg py-2 hover:bg-blue-50 transition-colors disabled:opacity-50">
              {locating ? '⏳ Locating…' : '📍 Use my location'}
            </button>
          </div>

          {/* Category chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilter('category', '')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${!filters.category ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}>
                All
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat.value}
                  onClick={() => setFilter('category', filters.category === cat.value ? '' : cat.value)}
                  style={filters.category === cat.value
                    ? { background: cat.color, borderColor: cat.color, color: '#fff' }
                    : {}}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${filters.category !== cat.value ? 'border-gray-300 text-gray-600 hover:border-gray-400' : ''}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date Range</label>
            <div className="flex flex-col gap-2">
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleInput}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="date" name="dateTo" value={filters.dateTo} onChange={handleInput}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Price (RON)</label>
            <div className="flex gap-2">
              <input type="number" name="minPrice" value={filters.minPrice} onChange={handleInput}
                placeholder="Min" min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleInput}
                placeholder="Max" min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {/* Legend */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</label>
            <div className="grid grid-cols-2 gap-y-2">
              {CATEGORIES.map(cat => (
                <div key={cat.value} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-base leading-none">{cat.emoji}</span>
                  <span className="font-medium" style={{ color: cat.color }}>{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Count footer */}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 bg-gray-50 flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400' : 'bg-green-500'}`} />
          {loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
        </div>
      </aside>

      {/* ── Map ─────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer center={[44.4268, 26.1025]} zoom={12} className="h-full w-full">

          {/* CartoDB Voyager — clean, modern, OSM-based */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxZoom={19}
          />

          {userCoords && (
            <>
              <FlyTo coords={userCoords} />
              <Marker position={userCoords} icon={userDotIcon}>
                <Popup><span className="text-sm font-medium">📍 You are here</span></Popup>
              </Marker>
              <Circle
                center={userCoords}
                radius={filters.radius * 1000}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }}
              />
            </>
          )}

          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            maxClusterRadius={45}
            disableClusteringAtZoom={14}
            spiderfyOnMaxZoom={true}
          >
            {events.map(ev => (
              <Marker
                key={ev.id}
                position={[+ev.latitude, +ev.longitude]}
                icon={makePinIcon(ev.category)}
              >
                <Popup maxWidth={240} className="localpulse-popup">
                  <div className="min-w-[200px]">
                    {/* Category badge */}
                    <span
                      className="inline-block text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                      style={{ background: colorOf(ev.category) }}>
                      {emojiOf(ev.category)} {ev.category}
                    </span>

                    <p className="font-bold text-gray-900 text-sm leading-snug mb-1">{ev.title}</p>

                    <p className="text-xs text-gray-500 mb-0.5">
                      📅 {new Date(ev.date_time).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                      {' · '}
                      {new Date(ev.date_time).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500 truncate mb-1">📍 {ev.address}</p>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-800">
                        {Number(ev.price) > 0
                          ? `${Number(ev.price).toFixed(0)} RON`
                          : <span className="text-green-600">Free</span>}
                      </span>
                      {ev.distance_km != null && (
                        <span className="text-xs text-gray-400">{Number(ev.distance_km).toFixed(1)} km away</span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="w-full text-xs font-semibold text-white py-1.5 rounded-lg transition-colors"
                      style={{ background: colorOf(ev.category) }}>
                      View details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}
