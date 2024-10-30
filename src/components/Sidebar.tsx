import React from 'react';
import { 
  Book, MessageSquareText, BookMarked, Star, MessagesSquare, Store, ClipboardList, 
  HelpCircle, FileText, Home as HomeIcon, Shield, Sun, Moon, LogOut, Settings 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModuleSettings } from '../hooks/useModuleSettings';

const Sidebar = ({ 
  activeView, 
  setActiveView, 
  darkMode, 
  toggleDarkMode,
  isAdmin,
  isAuthenticated,
  onAuthRequired,
  closeSidebar
}: {
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  closeSidebar: () => void;
}) => {
  const { signOut } = useAuth();
  const { settings } = useModuleSettings();

  const handleSignOut = async () => {
    try {
      await signOut();
      setActiveView('home');
      closeSidebar();
    } catch (error) {
      setActiveView('home');
      closeSidebar();
    }
  };

  const handleNavigation = (view: string) => {
    if (view === activeView) {
      closeSidebar();
      return;
    }

    if (!isAuthenticated && ['chat', 'favorites', 'survey', 'assistant', 'whatisthis', 'posts', 'settings'].includes(view)) {
      onAuthRequired();
      closeSidebar();
      return;
    }

    setActiveView(view);
    closeSidebar();
  };

  const menuItems = [
    { id: 'home', icon: HomeIcon, label: 'Home', enabled: true },
    { id: 'manuals', icon: Book, label: 'Browse Manuals', enabled: settings?.manuals_enabled },
    { id: 'standards', icon: BookMarked, label: 'Standards', enabled: settings?.standards_enabled },
    { id: 'suppliers', icon: Store, label: 'Find Suppliers', enabled: settings?.suppliers_enabled },
    { id: 'chat', icon: MessagesSquare, label: 'Community Chat', requiresAuth: true, enabled: settings?.community_chat_enabled },
    { id: 'favorites', icon: Star, label: 'My Favorites', requiresAuth: true, enabled: settings?.favorites_enabled },
    { id: 'survey', icon: ClipboardList, label: 'Site Survey', requiresAuth: true, enabled: settings?.survey_enabled },
    { id: 'assistant', icon: MessageSquareText, label: 'AI Assistant', requiresAuth: true, enabled: settings?.ai_assistant_enabled },
    { id: 'whatisthis', icon: HelpCircle, label: 'WTF?', requiresAuth: true, enabled: settings?.wtf_enabled },
    { id: 'posts', icon: FileText, label: 'User Posts', requiresAuth: true, enabled: settings?.user_posts_enabled },
    { id: 'settings', icon: Settings, label: 'Settings', requiresAuth: true, enabled: true },
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin Dashboard', requiresAuth: true, enabled: true }] : []),
  ].filter(item => item.enabled);

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              <span>{item.label}</span>
              {item.requiresAuth && !isAuthenticated && (
                <span className="ml-auto block w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {isAuthenticated ? (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={onAuthRequired}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
