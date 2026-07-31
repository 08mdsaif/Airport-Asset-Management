import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import AssetList from './pages/assets/AssetList';
import AssetForm from './pages/assets/AssetForm';
import AssetDetail from './pages/assets/AssetDetail';

import QRScanner from './pages/qr/QRScanner';

import ComplaintList from './pages/complaints/ComplaintList';
import ComplaintForm from './pages/complaints/ComplaintForm';
import ComplaintDetail from './pages/complaints/ComplaintDetail';

import MaintenanceList from './pages/maintenance/MaintenanceList';
import MaintenanceForm from './pages/maintenance/MaintenanceForm';
import MaintenanceDetail from './pages/maintenance/MaintenanceDetail';

import Notifications from './pages/notifications/Notifications';
import Reports from './pages/reports/Reports';
import Analytics from './pages/analytics/Analytics';
import Departments from './pages/departments/Departments';
import Users from './pages/users/Users';
import Transfers from './pages/transfers/Transfers';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes (any authenticated role) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/assets" element={<AssetList />} />
          <Route path="/assets/:id" element={<AssetDetail />} />

          <Route path="/qr-scanner" element={<QRScanner />} />

          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/complaints/new" element={<ComplaintForm />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />

          <Route path="/maintenance" element={<MaintenanceList />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetail />} />

          <Route path="/notifications" element={<Notifications />} />

          {/* Admin/Supervisor only */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/:id/edit" element={<AssetForm />} />
            <Route path="/maintenance/new" element={<MaintenanceForm />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/transfers" element={<Transfers />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/departments" element={<Departments />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
