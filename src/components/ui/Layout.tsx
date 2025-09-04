import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { Home, Send, User, Search, Clock, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentTab: 'home' | 'send' | 'activity' | 'search' | 'profile';
  onTabChange: (tab: 'home' | 'send' | 'activity' | 'search' | 'profile') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'send' as const, icon: Send, label: 'Pay' },
    { id: 'activity' as const, icon: Clock, label: 'Activity' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">💰</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">StablePay</h1>
          </div>
          
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="venmo-avatar">
                  {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content - with bottom padding to account for fixed navigation */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Fixed Bottom Navigation - Always visible and locked */}
      <nav className="nav-locked bg-white border-t border-gray-200 px-2 py-2 shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
                  isActive
                    ? 'text-blue-500 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`Navigate to ${tab.label}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : ''}`} />
                <span className={`text-xs mt-1 font-medium truncate ${isActive ? 'text-blue-500' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
