import { useState, useEffect } from 'react';
import { Plus, Loader, Wand2, Bell, History, Trash2 } from 'lucide-react';
import { adminAPI, aiAPI } from '../../utils/api';
import { formatDate } from '../../utils/dateFormatter';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [idea, setIdea] = useState('');
  const [draftedContent, setDraftedContent] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expires_at: '',
    priority: 'medium'
  });
  const [draftLoading, setDraftLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, [activeTab]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = activeTab === 'active' 
        ? await adminAPI.getNotices() 
        : await adminAPI.getNoticesHistory();
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!idea.trim()) {
      alert('Please enter an idea');
      return;
    }

    try {
      setDraftLoading(true);
      const response = await aiAPI.draftNotice({ idea });
      setDraftedContent(response.data.draftNotice);
    } catch (error) {
      alert('Error generating draft: ' + error.message);
    } finally {
      setDraftLoading(false);
    }
  };

  const useDraftContent = () => {
    setFormData({
      ...formData,
      content: draftedContent
    });
    setDraftedContent('');
    setIdea('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Calculate expiry date if selected
      let expiryDate = undefined; // Use undefined by default to trigger 24h backend default
      
      if (formData.expires_at === 'never') {
        expiryDate = null; // Specifically set to null for permanent
      } else if (formData.expires_at) {
        const hours = parseInt(formData.expires_at);
        expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      await adminAPI.createNotice({ ...formData, expires_at: expiryDate });
      setFormData({ title: '', content: '', expires_at: '', priority: 'medium' });
      setShowForm(false);
      setActiveTab('active'); // Switch to active tab to see the new notice
      await fetchNotices();
    } catch (error) {
      alert('Error creating notice: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this notice?')) {
      return;
    }

    try {
      setDeletingId(id);
      await adminAPI.deleteNotice(id);
      setNotices(notices.filter(notice => notice.id !== id));
    } catch (error) {
      alert('Error deleting notice: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Notice Board</h1>
          <p className="text-slate-600 mt-2">Publish announcements to all students</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Notice</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'active' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell size={16} />
          <span>Active Notices</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'history' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History size={16} />
          <span>Notice History</span>
        </button>
      </div>

      {/* Create Notice Form */}
      {showForm && (
        <div className="card border-2 border-indigo-200 bg-indigo-50">
          <h2 className="text-2xl font-bold text-indigo-900 mb-6">Publish New Notice</h2>

          {/* AI Draft Section */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-300">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Wand2 size={20} className="text-indigo-600" />
              <span>AI-Powered Auto-Draft</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Brief Idea (e.g., "Water outage at 2pm", "Maintenance day tomorrow")
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Enter a brief idea or topic..."
                  className="input-field h-20"
                />
              </div>

              <button
                type="button"
                onClick={generateDraft}
                disabled={draftLoading || !idea.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {draftLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    <span>Generate Professional Draft</span>
                  </>
                )}
              </button>

              {draftedContent && (
                <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">AI-Generated Draft:</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">
                    {draftedContent}
                  </p>
                  <button
                    type="button"
                    onClick={useDraftContent}
                    className="btn-primary text-sm"
                  >
                    Use This Draft
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Notice Creation */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-indigo-300 pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Notice content..."
                className="input-field h-32"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Auto-Expire After</label>
                <select
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="input-field"
                >
                  <option value="">24 Hours (Default)</option>
                  <option value="1">1 Hour (Testing)</option>
                  <option value="48">48 Hours</option>
                  <option value="168">1 Week</option>
                  <option value="never">Never (Permanent)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Notice'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', content: '', expires_at: '', priority: 'medium' });
                  setDraftedContent('');
                  setIdea('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Published Notices */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {activeTab === 'active' ? 'Active' : 'Archived'} Notices
        </h2>

        {notices.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-600 text-lg">No {activeTab} notices found</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`card border-l-4 ${
                activeTab === 'active' ? 'border-indigo-600' : 'border-slate-400 grayscale-[0.5]'
              } hover:shadow-md transition relative group`}
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(notice.id)}
                disabled={deletingId === notice.id}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete Notice"
              >
                {deletingId === notice.id ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>

              <div className="flex items-start justify-between mb-3 pr-10">
                <h3 className="text-xl font-bold text-slate-900">{notice.title}</h3>
                <div className="text-right">
                  <span className="block text-xs text-slate-500">
                    Posted: {formatDate(notice.date)}
                  </span>
                  {notice.expires_at && (
                    <span className={`block text-xs ${activeTab === 'active' ? 'text-indigo-400' : 'text-slate-400'}`}>
                      Expires: {formatDate(notice.expires_at)}
                    </span>
                  )}
                  {!notice.expires_at && (
                     <span className="block text-xs text-slate-400">
                      Permanent
                    </span>
                  )}
                </div>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mb-3">
                {notice.content}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Published by: {notice.createdBy?.name || 'Admin'}</span>
                <div className="flex items-center space-x-2">
                  {notice.priority && (
                     <span className={`px-2 py-0.5 rounded-full font-medium ${
                      notice.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      notice.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {notice.priority.toUpperCase()}
                    </span>
                  )}
                  <span className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    <span>{notice.acknowledgeCount || 0} Acknowledged</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotices;
