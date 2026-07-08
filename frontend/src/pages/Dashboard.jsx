import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CATEGORIES = ['music','sports','workshops','food','art','tech','other'];
const EMPTY_FORM = { title:'', description:'', date_time:'', category:'other', price:'0', capacity:'', address:'' };

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data.length === 0) throw new Error(`Address not found: "${address}". Try a more specific address.`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 16);
}

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [imageFile,   setImageFile]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');

  const fetchMyEvents = () => {
    setLoading(true);
    api.get('/events/organizer/me')
      .then(r => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMyEvents(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev.id);
    setFormData({
      title:       ev.title,
      description: ev.description || '',
      date_time:   toDatetimeLocal(ev.date_time),
      category:    ev.category,
      price:       String(ev.price),
      capacity:    ev.capacity ? String(ev.capacity) : '',
      address:     ev.address,
    });
    setImageFile(null);
    setFormError('');
    setShowForm(true);
  };

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { lat, lng } = await geocodeAddress(formData.address);
      const fd = new FormData();
      Object.entries({ ...formData, latitude: lat, longitude: lng }).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        await api.put(`/events/${editingId}`, fd, cfg);
      } else {
        await api.post('/events', fd, cfg);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      setImageFile(null);
      fetchMyEvents();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this event?')) return;
    try { await api.delete(`/events/${id}`); fetchMyEvents(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const totalAttendees = events.reduce((s, e) => s + Number(e.attendee_count || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organizer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hi {user?.username} — manage your events below</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5">
          + New Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Total Events',    value: events.length,    icon:'🎪' },
          { label:'Total Attendees', value: totalAttendees,   icon:'👥' },
          { label:'Published',       value: events.filter(e => e.status === 'published').length, icon:'✅' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Event' : 'Create New Event'}
          </h2>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Title *</label>
              <input name="title" value={formData.title} onChange={handleChange} required
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Date & Time *</label>
              <input type="datetime-local" name="date_time" value={formData.date_time} onChange={handleChange} required
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Price (RON) — 0 = free</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01"
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Capacity (leave blank = unlimited)</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" placeholder="—"
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">
                Address * <span className="font-normal text-gray-400">(automatically geocoded via OpenStreetMap)</span>
              </label>
              <input name="address" value={formData.address} onChange={handleChange} required
                placeholder="e.g. Piata Universitatii, Bucharest"
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">
                Event Image {editingId ? '(leave blank to keep existing)' : '(optional, max 5 MB)'}
              </label>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => setImageFile(e.target.files[0])}
                className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border-0 file:rounded-lg file:bg-blue-50 file:text-blue-700 file:text-xs file:font-medium hover:file:bg-blue-100" />
            </div>

            <div className="col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors">
                {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Event list */}
      <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Your Events</h2>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-4xl mb-2">🎪</p>
          <p className="font-medium text-gray-600">No events yet</p>
          <button onClick={openCreate} className="mt-3 text-blue-600 hover:underline text-sm">Create your first event →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(ev => (
            <div key={ev.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800 text-sm truncate">{ev.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                    ev.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{ev.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(ev.date_time).toLocaleString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                  {' · '}{ev.address}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  👥 {ev.attendee_count} attending
                  {ev.capacity ? ` / ${ev.capacity} capacity` : ''}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => navigate(`/events/${ev.id}`)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  View
                </button>
                <button onClick={() => openEdit(ev)}
                  className="px-3 py-1.5 text-xs border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(ev.id)}
                  className="px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
