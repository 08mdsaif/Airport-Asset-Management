import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await api.get('/notifications?unreadOnly=true&limit=1')).data,
    refetchInterval: 30_000,
  });

  return (
    <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <button onClick={onMenuClick} className="md:hidden">
        <Menu size={22} />
      </button>
      <div className="hidden md:block">
        <h1 className="text-lg font-semibold">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role} • {typeof user?.department === 'object' ? user?.department?.name : ''}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Notifications"
        >
          <Bell size={20} />
          {!!notifData?.unreadCount && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {notifData.unreadCount > 9 ? '9+' : notifData.unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
              {user?.name?.charAt(0)}
            </div>
            <ChevronDown size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div className="px-4 py-2 text-sm border-b border-gray-100 dark:border-gray-700">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
