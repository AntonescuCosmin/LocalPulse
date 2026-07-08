import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function EventDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [event,    setEvent]   = useState(null);
  const [status,   setStatus]  = useState({ saved: false, attending: false });
  const [loading,  setLoading] = useState(true);
  const [actLoad,  setActLoad] = useState(false);
  const [actError, setActError] = useState('');

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data))
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (user) {
      api.get(`/users/me/events/status/${id}`).then(r => setStatus(r.data)).catch(() => {});
    }
  }, [id, user]);

  const toggle = async (type) => {
    if (!user) { navigate('/login'); return; }
    setActLoad(true);
    setActError('');
    const isSave = type === 'save';
    const isActive = isSave ? status.saved : status.attending;
    const method   = isActive ? 'delete' : 'post';
    const endpoint = `/users/events/${id}/${isSave ? 'save' : 'attend'}`;
    try {
      await api[method](endpoint);
      setStatus(s => ({ ...s, [isSave ? 'saved' : 'attending']: !isActive }));
      setEvent(e => ({
        ...e,
        [isSave ? 'save_count' : 'attendee_count']:
          Number(e[isSave ? 'save_count' : 'attendee_count']) + (isActive ? -1 : 1),
      }));
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg) setActError(msg);
    }
    finally { setActLoad(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Link copied to clipboard!'));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;
  if (!event)  return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1">
        ← Back
      </button>

      {event.image_url ? (
        <img src={`http://localhost:5000${event.image_url}`} alt={event.title}
          className="w-full h-56 object-cover rounded-2xl mb-6" />
      ) : (
        <div className="w-full h-56 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-6 flex items-center justify-center text-6xl">
          {event.category === 'music' ? '🎵' : event.category === 'sports' ? '⚽' :
           event.category === 'food'  ? '🍕' : event.category === 'tech'   ? '💻' :
           event.category === 'art'   ? '🎨' : event.category === 'workshops' ? '🛠️' : '📅'}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
          <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full capitalize flex-shrink-0">
            {event.category}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <span>📅</span>
            {new Date(event.date_time).toLocaleString('en-GB', { dateStyle:'long', timeStyle:'short' })}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>💰</span>
            {event.price > 0 ? `${event.price} RON` : <span className="text-green-600 font-medium">Free entry</span>}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📍</span> {event.address}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>🎪</span> {event.organizer_name}
          </div>
          {event.capacity && (
            <div className="flex items-center gap-2 text-gray-600">
              <span>👥</span> {event.attendee_count} / {event.capacity} attending
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-gray-700 text-sm leading-relaxed mb-6">{event.description}</p>
        )}

        {/* Action buttons */}
        {actError && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            {actError}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => toggle('attend')} disabled={actLoad}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              status.attending
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {status.attending ? '✓ Attending' : 'RSVP — Attend'}
          </button>
          <button
            onClick={() => toggle('save')} disabled={actLoad}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              status.saved
                ? 'border-red-400 text-red-500 bg-red-50 hover:bg-red-100'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.saved ? '♥' : '♡'} Save
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
