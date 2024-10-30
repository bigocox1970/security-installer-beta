import React, { useState } from 'react';
import { Settings, Users, Database, Image, Store } from 'lucide-react';
import ModuleSettings from './ModuleSettings';
import UserManagement from './UserManagement';
import ApiSettings from './ApiSettings';
import WtfSettings from './WtfSettings';
import SupplierSettings from './SupplierSettings';
import { useSupplierSettings } from '../../hooks/useSupplierSettings';
import { useWtfSettings } from '../../hooks/useWtfSettings';

const tabs = [
  { id: 'modules', label: 'Module Settings', icon: Settings },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'api', label: 'API Settings', icon: Database },
  { id: 'wtf', label: 'WTF Settings', icon: Image },
  { id: 'suppliers', label: 'Supplier Settings', icon: Store }
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('modules');
  const {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
    isEditing: suppliersEditing,
    handleSupplierChange,
    handleSaveSuppliers,
    addNewSupplier
  } = useSupplierSettings();

  const {
    settings: wtfSettings,
    loading: wtfLoading,
    error: wtfError,
    isEditing: wtfEditing,
    handleSettingChange: handleWtfSettingChange,
    handleSaveSettings: handleSaveWtfSettings
  } = useWtfSettings();

  const renderContent = () => {
    switch (activeTab) {
      case 'modules':
        return <ModuleSettings />;
      case 'users':
        return <UserManagement />;
      case 'api':
        return <ApiSettings />;
      case 'wtf':
        return (
          <WtfSettings
            settings={wtfSettings}
            isEditing={wtfEditing}
            handleSettingChange={handleWtfSettingChange}
            handleSaveSettings={handleSaveWtfSettings}
          />
        );
      case 'suppliers':
        return (
          <SupplierSettings
            suppliers={suppliers}
            isEditing={suppliersEditing}
            handleSupplierChange={handleSupplierChange}
            handleSaveSuppliers={handleSaveSuppliers}
            addNewSupplier={addNewSupplier}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 inline-flex items-center space-x-2 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
