import React, { useState, useEffect } from 'react';
import { Shield, Menu } from 'lucide-react';
import ManualList from './components/ManualList';
import AiAssistant from './components/AiAssistant';
import Standards from './components/Standards';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import Home from './components/Home';
import UserPosts from './components/UserPosts';
import CommunityChat from './components/CommunityChat';
import Favorites from './components/Favorites';
import Survey from './components/Survey';
import SupplierFinder from './components/SupplierFinder';
import AdminDashboard from './components/AdminDashboard';
import WhatIsThis from './components/WhatIsThis';
import UserSettings from './components/UserSettings';
import ChatBubble from './components/ChatBubble';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAuthRequired = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <Home 
            setActiveView={setActiveView}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            onAuthRequired={handleAuthRequired}
          />
        );
      case 'manuals':
        return <ManualList onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'standards':
        return <Standards onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'assistant':
        return <AiAssistant onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'chat':
        return <CommunityChat onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'favorites':
        return <Favorites onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'survey':
        return <Survey onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'suppliers':
        return <SupplierFinder onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'whatisthis':
        return <WhatIsThis onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'posts':
        return <UserPosts onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'settings':
        return <UserSettings onAuthRequired={handleAuthRequired} isAuthenticated={isAuthenticated} />;
      case 'admin':
        return isAdmin ? <AdminDashboard /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex h-screen w-full bg-white dark:bg-gray-900 transition-colors duration-200">
        {/* Sidebar with responsive behavior */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            onAuthRequired={handleAuthRequired}
            closeSidebar={closeSidebar}
          />
        </div>
        
        <main className="flex-1 overflow-auto" onClick={closeSidebar}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-2 mb-8">
              {/* Mobile menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SecurityInstaller.app</h1>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthenticated={() => setShowAuthModal(false)}
      />

      <ChatBubble />
    </div>
  );
}

export default App;
