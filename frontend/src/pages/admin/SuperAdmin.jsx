import { useState, useEffect } from 'react';
import { Loader, Users, Trash2, Search, Shield, Mail, Phone, Calendar, AlertTriangle, CheckCircle, Crown, Lock, Eye, Edit, UserPlus, RefreshCw, Key, X, Check } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/dateFormatter';

// ... (UserDocument component stays the same) ...
const UserDocument = ({ filename, userName, className }) => {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    if (!filename) {
      setLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await adminAPI.getPhoto(filename);
        objectUrl = URL.createObjectURL(response.data);
        setSrc(objectUrl);
      } catch (error) {
        console.error(`Failed to load document for ${userName}:`, error);
        setSrc(PLACEHOLDER_SVG);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filename, userName]);

  if (loading) {
    return (
      <div className={`${className} bg-slate-200 animate-pulse flex items-center justify-center rounded-lg`}>
        <Loader className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (!filename) {
    return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400`}>
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm font-medium">No document uploaded</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={src || PLACEHOLDER_SVG}
        alt={`ID Proof - ${userName}`}
        className={`${className} object-cover rounded-lg shadow-md border border-slate-200`}
        onError={() => setSrc(PLACEHOLDER_SVG)}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
          title="Open in new tab"
        >
          <Eye size={20} className="text-indigo-600" />
        </a>
      </div>
    </div>
  );
};

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // Reset Password States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState('Havenly123');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
    // Get current user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      // Ensure users is always an array
      const usersData = Array.isArray(response.data) ? response.data : [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setDeletingId(userId);
      await adminAPI.deleteUser(userId);
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      setResettingId(selectedUser.id);
      await adminAPI.resetPassword(selectedUser.id, newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(false);
        setNewPassword('Havenly123');
      }, 3000);
    } catch (error) {
      alert('Error resetting password: ' + error.message);
    } finally {
      setResettingId(null);
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    if (resettingId) return;
    setShowResetModal(false);
    setSelectedUser(null);
    setResetSuccess(false);
  };

  const openProfileModal = (user) => {
    setProfileUser(user);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setProfileUser(null);
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) : [];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (user) => {
    if (user.room_id) {
      return <CheckCircle className="text-green-600" size={16} />;
    }
    return <AlertTriangle className="text-yellow-600" size={16} />;
  };

  const isSuperAdmin = (user) => {
    return user.email === 'gajula@gmail.com';
  };

  const canDeleteUser = (user) => {
    // Cannot delete self or the super admin
    return !isSuperAdmin(user) && user.id !== currentUser?.id;
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
          <h1 className="text-4xl font-bold text-slate-900 flex items-center space-x-3">
            <Crown className="text-yellow-500" size={40} />
            <span>Super Admin Panel</span>
            <Lock className="text-red-500" size={24} />
          </h1>
          <p className="text-slate-600 mt-2">Complete system control - Manage all user profiles</p>
          {currentUser?.email === 'gajula@gmail.com' && (
            <div className="mt-2 flex items-center space-x-2">
              <Shield className="text-green-600" size={16} />
              <span className="text-sm text-green-600 font-medium">Super Admin Access Confirmed</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-3xl font-bold text-indigo-600">{Array.isArray(users) ? users.length : 0}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div>
            <h3 className="text-red-900 font-semibold">Super Admin Privileges</h3>
            <p className="text-red-700 text-sm">You have complete control over all user profiles and system data. Actions cannot be undone.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-blue-600" size={32} />
            <span className="text-3xl font-bold text-blue-600">
              {Array.isArray(users) ? users.filter(u => u.role === 'student').length : 0}
            </span>
          </div>
          <p className="text-slate-600 text-sm">Students</p>
          <p className="text-xs text-slate-500 mt-2">Active student accounts</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <Shield className="text-purple-600" size={32} />
            <span className="text-3xl font-bold text-purple-600">
              {Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0}
            </span>
          </div>
          <p className="text-slate-600 text-sm">Administrators</p>
          <p className="text-xs text-slate-500 mt-2">System administrators</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="text-yellow-600" size={32} />
            <span className="text-3xl font-bold text-yellow-600">
              {Array.isArray(users) ? users.filter(u => !u.room_id).length : 0}
            </span>
          </div>
          <p className="text-slate-600 text-sm">Unassigned</p>
          <p className="text-xs text-slate-500 mt-2">Users without rooms</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="text-green-600" size={32} />
            <span className="text-3xl font-bold text-green-600">
              {Array.isArray(users) ? users.filter(u => u.room_id).length : 0}
            </span>
          </div>
          <p className="text-slate-600 text-sm">Assigned</p>
          <p className="text-xs text-slate-500 mt-2">Users with rooms</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Search className="text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">All User Profiles</h2>

        {filteredUsers.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No users found</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">User</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Room</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isSuperAdmin(user) ? 'bg-yellow-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuperAdmin(user) ? 'bg-yellow-100' : 'bg-indigo-100'}`}>
                        <span className={`${isSuperAdmin(user) ? 'text-yellow-600' : 'text-indigo-600'} font-semibold`}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 flex items-center space-x-2">
                          {user.name || 'Unknown'}
                          {isSuperAdmin(user) && <Crown className="text-yellow-500" size={16} />}
                        </p>
                        <p className="text-sm text-slate-500">ID: {user.id?.slice(-8) || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-slate-600">{user.email || 'N/A'}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-slate-600">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.room_id ? (
                      <span className="text-sm text-slate-600 font-medium">
                        Room {user.room_id?.room_number || 'Assigned'}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">No Room</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user)}
                      <span className="text-sm text-slate-600">
                        {user.room_id ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => openProfileModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openResetModal(user)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      {canDeleteUser(user) ? (
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={deletingId === user.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Delete User"
                        >
                          {deletingId === user.id ? (
                            <Loader className="animate-spin" size={18} />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1 text-slate-400 p-2" title="System Protected">
                          <Lock size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Key className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reset User Password</h3>
              </div>
              <button 
                onClick={closeResetModal} 
                className="text-slate-400 hover:text-slate-600 rounded-full p-2 hover:bg-slate-100 transition"
              >
                <X size={24} />
              </button>
            </div>

            {resetSuccess ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-green-600" size={32} />
                </div>
                <p className="text-slate-900 font-bold text-lg mb-2">Password Reset Successful!</p>
                <p className="text-slate-600">The new password is: <span className="font-mono bg-slate-100 px-2 py-1 rounded font-bold text-indigo-700">{newPassword}</span></p>
                <p className="text-xs text-slate-500 mt-2">Closing automatically...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-sm text-slate-600">You are resetting the password for:</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedUser.name}</p>
                  <p className="text-xs text-slate-500 italic">{selectedUser.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Set New Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={() => setNewPassword('Havenly' + Math.floor(100+Math.random()*900))}
                      className="absolute right-2 top-1.5 p-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Note: Communicate this new password to the user once reset.</p>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingId === selectedUser.id}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {resettingId === selectedUser.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader className="animate-spin" size={18} />
                        <span>Resetting...</span>
                      </div>
                    ) : (
                      'Confirm Reset'
                    )}
                  </button>
                  <button
                    onClick={closeResetModal}
                    className="flex-1 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && profileUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
               onClick={closeProfileModal}
               className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition"
            >
               <X size={24} />
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar Info */}
              <div className="md:w-1/3 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
                <div className={`w-24 h-24 rounded-2xl mx-auto md:mx-0 flex items-center justify-center mb-4 ${isSuperAdmin(profileUser) ? 'bg-yellow-100' : 'bg-indigo-100'}`}>
                   <span className={`text-4xl font-bold ${isSuperAdmin(profileUser) ? 'text-yellow-600' : 'text-indigo-600'}`}>
                      {profileUser.name?.charAt(0)?.toUpperCase()}
                   </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{profileUser.name}</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${getRoleBadge(profileUser.role)}`}>
                  {profileUser.role}
                </span>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Mail size={18} className="text-slate-400" />
                      <span className="truncate">{profileUser.email}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Phone size={18} className="text-slate-400" />
                      <span>{profileUser.phone || 'No phone set'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Calendar size={18} className="text-slate-400" />
                      <span>Joined {formatDate(profileUser.createdAt)}</span>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 space-y-3">
                   <button 
                     onClick={() => {
                        closeProfileModal();
                        openResetModal(profileUser);
                     }}
                     className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 py-3 rounded-xl font-bold hover:bg-amber-100 transition"
                   >
                     <Key size={18} /> Reset Password
                   </button>
                   {canDeleteUser(profileUser) && (
                     <button 
                       onClick={() => {
                          closeProfileModal();
                          openDeleteModal(profileUser);
                       }}
                       className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition"
                     >
                       <Trash2 size={18} /> Delete Account
                     </button>
                   )}
                </div>
              </div>

              {/* Main Content */}
              <div className="md:w-2/3 space-y-8">
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Account Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Room Assignment</p>
                          <div className="flex items-center gap-2">
                             {profileUser.room_id ? <CheckCircle className="text-green-600" size={16} /> : <AlertTriangle className="text-amber-600" size={16} />}
                             <span className="font-bold text-slate-900">{profileUser.room_id ? `Room ${profileUser.room_id.room_number}` : 'Unassigned'}</span>
                          </div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Recovery Setup</p>
                          <div className="flex items-center gap-2">
                             {profileUser.securityQuestion ? <CheckCircle className="text-green-600" size={16} /> : <AlertTriangle className="text-amber-600" size={16} />}
                             <span className="font-bold text-slate-900">{profileUser.securityQuestion ? 'Enabled' : 'Not Setup'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification Document</h4>
                       <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">{profileUser.idProofType || 'NONE'}</span>
                    </div>
                    <UserDocument 
                      filename={profileUser.idProofUrl} 
                      userName={profileUser.name} 
                      className="w-full h-64 shadow-inner" 
                    />
                    <p className="text-center text-[10px] text-slate-400 mt-2 italic flex items-center justify-center gap-1">
                       <Shield size={10} /> Verified documentation provided during registration
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete User Account</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete this user account? This action cannot be undone and will remove all associated data.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-medium text-slate-900">{selectedUser.name}</p>
                <p className="text-sm text-slate-600">{selectedUser.email}</p>
                <p className="text-sm text-slate-500 mt-1">Role: {selectedUser.role}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={deletingId === selectedUser.id}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === selectedUser.id ? 'Deleting...' : 'Delete User'}
              </button>
              <button
                onClick={closeDeleteModal}
                disabled={deletingId === selectedUser.id}
                className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
