import { useAuth } from '../context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import EmployeeDashboard from './employee/EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.role === 'supervisor') {
    return <AdminDashboard />;
  }
  return <EmployeeDashboard />;
};

export default Dashboard;
