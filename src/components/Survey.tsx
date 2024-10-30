import React, { useState, useEffect } from 'react';
import { Save, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SurveyProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

interface SurveyData {
  id: string;
  customer_name: string;
  customer_address: string;
  system_type: string;
  control_equipment: string;
  grade: string;
  item_count: string;
  notes: string;
  created_at: string;
}

function Survey({ onAuthRequired, isAuthenticated }: SurveyProps) {
  const { user } = useAuth();
  const [systemType, setSystemType] = useState('');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    control_equipment: '',
    grade: '',
    item_count: '',
    notes: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchSurveys();
    }
  }, [isAuthenticated]);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (err) {
      console.error('Error fetching surveys:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const surveyData = {
        customer_name: formData.customer_name,
        customer_address: formData.customer_address,
        system_type: systemType,
        control_equipment: formData.control_equipment,
        grade: formData.grade,
        item_count: parseInt(formData.item_count) || 0,
        notes: formData.notes,
        user_id: user.id
      };

      if (selectedSurvey) {
        const { error } = await supabase
          .from('surveys')
          .update(surveyData)
          .eq('id', selectedSurvey);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('surveys')
          .insert([surveyData]);

        if (error) throw error;
      }

      await fetchSurveys();
      resetForm();
      alert('Survey saved successfully!');
    } catch (err) {
      console.error('Error saving survey:', err);
      alert('Failed to save survey. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_address: '',
      control_equipment: '',
      grade: '',
      item_count: '',
      notes: ''
    });
    setSystemType('');
    setSelectedSurvey(null);
    setIsNotesExpanded(false);
    setShowForm(false);
  };

  const handleSurveySelect = (survey: SurveyData) => {
    setSelectedSurvey(survey.id);
    setFormData({
      customer_name: survey.customer_name,
      customer_address: survey.customer_address,
      control_equipment: survey.control_equipment,
      grade: survey.grade,
      item_count: survey.item_count.toString(),
      notes: survey.notes
    });
    setSystemType(survey.system_type);
    setShowForm(true);
  };

  const renderSystemSpecificFields = () => {
    if (!systemType) return null;

    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {systemType === 'intruder' ? 'Control Equipment' : 
             systemType === 'cctv' ? 'DVR/NVR Type' :
             systemType === 'access' ? 'Controller Type' : 'Equipment Type'}
          </label>
          <input
            type="text"
            value={formData.control_equipment}
            onChange={(e) => setFormData({ ...formData, control_equipment: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {systemType !== 'other' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {systemType === 'intruder' ? 'Grade' : 
                 systemType === 'cctv' ? 'Resolution' : 'Access Level'}
              </label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {systemType === 'intruder' ? 'Number of Zones' : 
                 systemType === 'cctv' ? 'Number of Cameras' : 'Number of Items'}
              </label>
              <input
                type="number"
                value={formData.item_count}
                onChange={(e) => setFormData({ ...formData, item_count: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </>
        )}
      </>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to create surveys.</p>
          <button
            onClick={onAuthRequired}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Site Surveys</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          New Survey
        </button>
      </div>

      {surveys.length > 0 && !showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                onClick={() => handleSurveySelect(survey)}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {survey.customer_name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {survey.customer_address}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {survey.system_type}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(survey.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Customer Address
              </label>
              <textarea
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                System Type
              </label>
              <select
                value={systemType}
                onChange={(e) => setSystemType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select system type</option>
                <option value="intruder">Intruder</option>
                <option value="cctv">CCTV</option>
                <option value="access">Access Control</option>
                <option value="other">Other</option>
              </select>
            </div>

            {renderSystemSpecificFields()}

            <div className={`relative ${isNotesExpanded ? 'fixed inset-0 z-50 bg-white dark:bg-gray-800 p-6' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                {isNotesExpanded && (
                  <button
                    type="button"
                    onClick={() => setIsNotesExpanded(false)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    Minimize
                  </button>
                )}
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                onFocus={() => setIsNotesExpanded(true)}
                className={`w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  isNotesExpanded ? 'h-[calc(100vh-200px)]' : 'h-32'
                }`}
                placeholder="Enter detailed notes about the site survey..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Survey</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Survey;