import React from 'react';
import { Book, MessageSquareText, BookMarked, Star, MessagesSquare, Store, ClipboardList, Upload, HelpCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModuleSettings } from '../hooks/useModuleSettings';

const Home = ({ 
  setActiveView, 
  isAdmin, 
  isAuthenticated, 
  onAuthRequired,
}: {
  setActiveView: (view: string) => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}) => {
  const { user } = useAuth();
  const { settings } = useModuleSettings();

  const handleNavigation = (view: string) => {
    if (!isAuthenticated && ['chat', 'favorites', 'survey', 'assistant', 'whatisthis', 'posts'].includes(view)) {
      onAuthRequired();
      return;
    }
    setActiveView(view);
  };

  const modules = [
    { id: 'manuals', icon: Book, label: 'Browse Manuals', color: 'border-blue-500 text-blue-500', enabled: settings?.manuals_enabled },
    { id: 'standards', icon: BookMarked, label: 'Standards', color: 'border-green-500 text-green-500', enabled: settings?.standards_enabled },
    { id: 'assistant', icon: MessageSquareText, label: 'AI Assistant', color: 'border-purple-500 text-purple-500', requiresAuth: true, enabled: settings?.ai_assistant_enabled },
    { id: 'favorites', icon: Star, label: 'My Favorites', color: 'border-amber-500 text-amber-500', requiresAuth: true, enabled: settings?.favorites_enabled },
    { id: 'suppliers', icon: Store, label: 'Find Suppliers', color: 'border-cyan-500 text-cyan-500', enabled: settings?.suppliers_enabled },
    { id: 'survey', icon: ClipboardList, label: 'Site Survey', color: 'border-purple-500 text-purple-500', requiresAuth: true, enabled: settings?.survey_enabled },
    { id: 'chat', icon: MessagesSquare, label: 'Community Chat', color: 'border-pink-500 text-pink-500', requiresAuth: true, enabled: settings?.community_chat_enabled },
    { id: 'whatisthis', icon: HelpCircle, label: 'WTF?', color: 'border-red-500 text-red-500', requiresAuth: true, enabled: settings?.wtf_enabled },
    { id: 'posts', icon: FileText, label: 'User Posts', color: 'border-indigo-500 text-indigo-500', requiresAuth: true, enabled: settings?.user_posts_enabled }
  ];

  // Filter enabled modules
  const enabledModules = modules.filter(module => module.enabled);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {enabledModules.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className="relative group"
          >
            <div className={`aspect-square rounded-2xl border-2 ${item.color.split(' ')[0]} bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 flex flex-col items-center justify-center space-y-2 transition-all transform hover:scale-105 hover:shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700`}>
              <item.icon className={`w-8 h-8 sm:w-12 sm:h-12 ${item.color.split(' ')[1]}`} />
              <span className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm text-center">
                {item.label}
              </span>
              {item.requiresAuth && !isAuthenticated && (
                <span className="absolute top-2 right-2">
                  <span className="block w-2 h-2 rounded-full bg-red-500"></span>
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;