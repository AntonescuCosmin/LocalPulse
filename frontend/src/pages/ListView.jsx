import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CAT_STYLE = {
  music:     'bg-purple-100 text-purple-700',
  sports:    'bg-green-100 text-green-700',
  workshops: 'bg-yellow-100 text-yellow-700',
  food:      'bg-red-100 text-red-700',
  art:       'bg-pink-100 text-pink-700',
  tech:      'bg-blue-100 text-blue-700',
  other:     'bg-gray-100 text-gray-700',
};
const CAT_EMOJI = {
  music: '🎵', sports: '⚽', workshops: '🛠️',
  food: '🍕', art: '🎨', tech: '💻', other: '📅',
};
const CATEGORIES = ['music','sports','workshops','food','art','tech','other'];

export default function ListView() {
  const navigate = useNavigate();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '', minPrice: '', maxPrice: '',
    search: '', dateFrom: '', dateTo: '',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => params[k] === '' && delete params[k]);
      const { data } = await api.get('/events', { params });
      setEvents(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleInput = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Browse Events</h1>
        <span className="text-sm text-gray-400">
          {loading ? 'Loading…' : `${events.length} result${events.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs text-gray-500 font-medium mb-1">Search</label>
            <input name="search" value={filters.search} onChange={handleInput} placeholder="Keyword…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Category</label>
            <select name="category" value={filters.category} onChange={handleInput}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">From date</label>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleInput}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">To date</label>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleInput}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Max price (RON)</label>
            <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleInput}
              placeholder="Any" min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading events…
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium text-gray-600">No events match your filters</p>
          <p className="text-sm mt-1">Try adjusting the date range or removing a filter</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map(ev => (
            <div key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
              {/* Thumbnail */}
              {ev.image_url ? (
                <img src={`http://localhost:5000${ev.image_url}`} alt={ev.title}
                  className="w-full h-36 object-cover group-hover:opacity-95 transition-opacity" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center text-4xl">
                  {CAT_EMOJI[ev.category] || '📅'}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug flex-1 line-clamp-2">{ev.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 font-medium ${CAT_STYLE[ev.category]}`}>
                    {ev.category}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span>📅</span>
                    {new Date(ev.date_time).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                    {' · '}
                    {new Date(ev.date_time).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span className="truncate">{ev.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-800 text-sm">
                    {Number(ev.price) > 0
                      ? `${Number(ev.price).toFixed(0)} RON`
                      : <span className="text-green-600">Free</span>}
                  </span>
                  <span className="text-xs text-gray-400">
                    {ev.attendee_count} attending
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
