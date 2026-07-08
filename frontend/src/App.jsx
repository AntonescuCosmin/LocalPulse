import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar       from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import MapView      from './pages/MapView';
import ListView     from './pages/ListView';
import EventDetail  from './pages/EventDetail';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Profile      from './pages/Profile';
import Dashboard    from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"           element={<MapView />} />
              <Route path="/events"     element={<ListView />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/login"      element={<Login />} />
              <Route path="/register"   element={<Register />} />
              <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/dashboard"  element={<PrivateRoute organizerOnly><Dashboard /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
