import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CAT_COLORS = {
  music:'bg-purple-100 text-purple-700', sports:'bg-green-100 text-green-700',
  workshops:'bg-yellow-100 text-yellow-700', food:'bg-red-100 text-red-700',
  art:'bg-pink-100 text-pink-700', tech:'bg-blue-100 text-blue-700', other:'bg-gray-100 text-gray-700',
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [tab,    setTab]    = useState('attend');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/events')
      .then(r => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => e.engagement_type === tab);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{user?.username}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
            user?.role === 'organizer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{key:'attend', label:'Attending'}, {key:'save', label:'Saved'}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label} ({events.filter(e => e.engagement_type === t.key).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-3xl mb-2">{tab === 'attend' ? '📅' : '♡'}</p>
          <p>{tab === 'attend' ? "You haven't RSVP'd to any events yet." : "You haven't saved any events yet."}</p>
          <button onClick={() => navigate('/')} className="mt-3 text-blue-600 hover:underline text-sm">
            Explore events →
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(ev => (
            <div key={`${ev.id}-${ev.engagement_type}`}
              onClick={() => navigate(`/events/${ev.id}`)}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{ev.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${CAT_COLORS[ev.category]}`}>
                  {ev.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                📅 {new Date(ev.date_time).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {ev.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
