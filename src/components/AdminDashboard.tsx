import React, { useState, useEffect } from 'react';
import { Users, Shield, Loader2, Map, Settings, MessageSquareText, FileText, PenTool } from 'lucide-react';
import UserManagement from './admin/UserManagement';
import AiAssistantSettings from './admin/AiAssistantSettings';
import ModuleSettings from './admin/ModuleSettings';
import SupplierSettings from './admin/SupplierSettings';
import UserPostsSettings from './admin/UserPostsSettings';
import WtfSettings from './admin/WtfSettings';
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'suppliers' | 'ai' | 'modules' | 'wtf' | 'posts'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
    }
    setLoading(false);
  }, [isAdmin]);

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'suppliers', label: 'Supplier Settings', icon: Map },
    { id: 'ai', label: 'AI Assistant', icon: MessageSquareText },
    { id: 'modules', label: 'Module Settings', icon: Settings },
    { id: 'wtf', label: 'WTF Settings', icon: Shield },
    { id: 'posts', label: 'User Posts Settings', icon: PenTool }
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 inline-block mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'suppliers' && <SupplierSettings />}
          {activeTab === 'ai' && <AiAssistantSettings />}
          {activeTab === 'modules' && <ModuleSettings />}
          {activeTab === 'wtf' && <WtfSettings />}
          {activeTab === 'posts' && <UserPostsSettings />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;