import { useState, useEffect } from 'react';
import { Loader, Users, Search, Mail, Phone, Calendar, CheckCircle, AlertTriangle, Eye, RefreshCw, Shield, X, Key, Check } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/dateFormatter';

const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb29mIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';

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
      <div className={`${className} bg-slate-200 animate-pulse flex items-center justify-center rounded-lg border border-slate-200`}>
        <Loader className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (!filename) {
    return (
      <div className={`${className} bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400`}>
        <AlertTriangle size={24} className="mb-2" />
        <p className="text-xs font-medium">No document uploaded</p>
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
          <Eye size={18} className="text-indigo-600" />
        </a>
      </div>
    </div>
  );
};

const AdminStudents = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // Reset Password States
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState('Havenly123');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      // Filter only students for this view
      const studentsOnly = Array.isArray(response.data) 
        ? response.data.filter(u => u.role === 'student') 
        : [];
      setUsers(studentsOnly);
    } catch (error) {
      console.error('Error fetching students:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent) return;
    try {
      setResettingId(selectedStudent.id);
      await adminAPI.resetPassword(selectedStudent.id, newPassword);
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

  const openProfileModal = (user) => {
    setProfileUser(user);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setProfileUser(null);
  };

  const openResetModal = (user) => {
    setSelectedStudent(user);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    if (resettingId) return;
    setShowResetModal(false);
    setSelectedStudent(null);
    setResetSuccess(false);
  };

  const filteredStudents = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Users className="text-indigo-600" size={40} />
            <span>Student Management</span>
          </h1>
          <p className="text-slate-600 mt-2">View and verify student profiles and documentation</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total Students</p>
          <p className="text-3xl font-bold text-indigo-600">{users.length}</p>
          <button
            onClick={fetchStudents}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 ml-auto"
          >
            <RefreshCw size={12} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 max-w-md">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Student</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Contact</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Room</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Verification</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Joined</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-slate-600 text-center py-8">No students found</td>
              </tr>
            ) : (
              filteredStudents.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">ID: {user.id?.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {user.room_id ? (
                      <span className="text-sm font-medium text-indigo-600">
                        Room {user.room_id?.room_number || 'Assigned'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {user.idProofUrl ? (
                        <>
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full uppercase">
                            {user.idProofType || 'Verified'}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="text-amber-600" size={16} />
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full uppercase">Pending</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => openProfileModal(user)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Key className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reset Student Password</h3>
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
                  <span className="text-green-600 text-3xl font-bold">✓</span>
                </div>
                <p className="text-slate-900 font-bold text-lg mb-2">Password Reset Successful!</p>
                <p className="text-slate-600">The new password is: <span className="font-mono bg-slate-100 px-2 py-1 rounded font-bold text-indigo-700">{newPassword}</span></p>
                <p className="text-xs text-slate-500 mt-2">Closing automatically...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-sm text-slate-600">You are resetting the password for:</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedStudent.name}</p>
                  <p className="text-xs text-slate-500 italic">{selectedStudent.email}</p>
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
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingId === selectedStudent.id}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {resettingId === selectedStudent.id ? (
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 border-b pb-6">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <span>Student Verification Profile</span>
                </h3>
                <button
                  onClick={closeProfileModal}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-sm text-slate-500">Full Name</span>
                        <span className="text-sm font-bold text-slate-900">{profileUser.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-sm text-slate-500">Email Address</span>
                        <span className="text-sm font-bold text-slate-900">{profileUser.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-sm text-slate-500">Phone Number</span>
                        <span className="text-sm font-bold text-slate-900">{profileUser.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Current Room</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {profileUser.room_id ? `Room ${profileUser.room_id.room_number}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-lg">
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2">Internal Status</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                        <CheckCircle size={24} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold">Active Resident</p>
                        <p className="text-xs text-indigo-200">Joined on {formatDate(profileUser.createdAt, { month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        closeProfileModal();
                        openResetModal(profileUser);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 py-3 rounded-xl font-bold hover:bg-amber-100 transition border border-amber-100 shadow-sm"
                    >
                      <Key size={18} /> Reset Password
                    </button>
                  </div>
                </div>

                {/* Identity Verification */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Identity Verification</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">ID Type</p>
                          <p className="text-base font-bold text-slate-900">{profileUser.idProofType || 'Not Provided'}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profileUser.idProofUrl ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {profileUser.idProofUrl ? 'Uploaded' : 'Missing'}
                        </div>
                      </div>

                      <div className="relative group">
                        <UserDocument 
                          filename={profileUser.idProofUrl} 
                          userName={profileUser.name} 
                          className="w-full h-56" 
                        />
                      </div>
                      <p className="text-xs text-slate-400 text-center italic">
                        Security Notice: Verification documents are encrypted and only accessible by administrators.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={closeProfileModal}
                  className="px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
