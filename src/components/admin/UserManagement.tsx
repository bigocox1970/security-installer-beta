import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types/admin';

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profiles, error: profilesError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const formattedUsers = profiles.map(profile => ({
        ...profile,
        status: profile.status || 'active'
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as 'admin' | 'user' } : user
      ));
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'deleted') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user');
    }
  };

  const reinstateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'active' } : user
      ));
    } catch (err) {
      console.error('Error reinstating user:', err);
      setError('Failed to reinstate user');
    }
  };

  const filteredUsers = showDeleted ? users : users.filter(user => user.status !== 'deleted');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Show deleted users</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.status === 'deleted' ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : user.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {user.status === 'deleted' ? (
                      <>
                        <button
                          onClick={() => reinstateUser(user.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to permanently remove this user? This action cannot be undone.')) {
                              removeUser(user.id);
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {user.status === 'active' && (
                          <>
                            <button
                              onClick={() => toggleUserRole(user.id, user.role)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            >
                              Make {user.role === 'admin' ? 'User' : 'Admin'}
                            </button>
                            <button
                              onClick={() => updateUserStatus(user.id, 'suspended')}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                            >
                              Suspend
                            </button>
                          </>
                        )}
                        {user.status === 'suspended' && (
                          <button
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              updateUserStatus(user.id, 'deleted');
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;