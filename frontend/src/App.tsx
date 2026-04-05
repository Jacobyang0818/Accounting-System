import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import QuickEntry from './pages/QuickEntry';
import Settings from './pages/Settings';
import MasterData from './pages/MasterData';
import Report from './pages/Report';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="entry" element={<QuickEntry />} />
          <Route path="settings" element={<Settings />} />
          <Route path="master-data" element={<MasterData />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
