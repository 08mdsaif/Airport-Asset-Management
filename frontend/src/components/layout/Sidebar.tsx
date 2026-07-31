import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Wrench,
  MessageSquareWarning,
  QrCode,
  Bell,
  FileBarChart,
  BarChart3,
  Users,
  Building2,
  ArrowLeftRight,
  X,
  PlaneTakeoff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'employee'] },
  { to: '/assets', label: 'Assets', icon: Boxes, roles: ['admin', 'supervisor', 'employee'] },
  { to: '/qr-scanner', label: 'QR Scanner', icon: QrCode, roles: ['admin', 'supervisor', 'employee'] },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, roles: ['admin', 'supervisor', 'employee'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'supervisor', 'employee'] },
  { to: '/transfers', label: 'Asset Transfers', icon: ArrowLeftRight, roles: ['admin', 'supervisor'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'supervisor'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'supervisor'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'supervisor', 'employee'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

const Sidebar = ({ isOpen, onClose }: Props) => {
  const { user } = useAuth();

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 h-full w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="text-primary-500" size={26} />
            <div>
              <p className="text-sm font-bold leading-tight">AAI Asset System</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Airports Authority of India</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
