import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Monitors from './pages/Monitors';
import MonitorDetail from './pages/MonitorDetail';
import Incidents from './pages/Incidents';
import AlertChannels from './pages/AlertChannels';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="monitors" element={<Monitors />} />
          <Route path="monitors/:id" element={<MonitorDetail />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="alerts" element={<AlertChannels />} />
        </Route>
        {/* Legacy redirects */}
        <Route path="/monitors" element={<Navigate to="/app/monitors" replace />} />
        <Route path="/monitors/:id" element={<Navigate to="/app/monitors" replace />} />
        <Route path="/incidents" element={<Navigate to="/app/incidents" replace />} />
        <Route path="/alerts" element={<Navigate to="/app/alerts" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
