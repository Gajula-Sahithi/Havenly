import { useState, useEffect } from 'react';
import { Loader, RefreshCw, Check, X, ArrowRightLeft, User, Home, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/dateFormatter';

const AdminRoomChanges = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRoomChanges();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching room changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const confirmMsg = `Are you sure you want to ${newStatus.toLowerCase()} this request?`;
    if (!window.confirm(confirmMsg)) return;

    const comment = prompt("Enter an optional comment (or leave blank):", "") || "";

    try {
      console.log(`[AdminRoomChanges] Updating request ${id} to ${newStatus}`);
      setUpdatingId(id);
      const response = await adminAPI.updateRoomChange(id, { 
        status: newStatus,
        admin_comment: comment 
      });
      console.log(`[AdminRoomChanges] Success:`, response.data);
      alert(`Request ${newStatus.toLowerCase()} successful!`);
      await fetchRequests();
    } catch (error) {
      console.error(`[AdminRoomChanges] Update failed:`, error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Error updating request: ${errorMsg}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = filterStatus === 'All'
    ? requests
    : requests.filter(r => r.status === filterStatus);

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
          <h1 className="text-4xl font-bold text-slate-900">Room Change Requests</h1>
          <p className="text-slate-600 mt-2">Approve or reject student requests to change rooms</p>
        </div>
        <button
          onClick={fetchRequests}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw size={20} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-6 py-3 font-medium transition ${
              filterStatus === status
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <ArrowRightLeft className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-slate-600">No {filterStatus.toLowerCase()} requests found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Student</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Rooms</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{request.user?.name}</p>
                        <p className="text-xs text-slate-500">{request.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">From</p>
                        <p className="font-bold text-slate-700">{request.current_room?.room_number || 'N/A'}</p>
                      </div>
                      <ArrowRightLeft size={16} className="text-slate-400" />
                      <div className="text-center">
                        <p className="text-xs text-indigo-500">To</p>
                        <p className="font-bold text-indigo-600">{request.requested_room?.room_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 max-w-xs">
                    <p className="text-sm text-slate-600 line-clamp-2" title={request.reason}>
                      {request.reason}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`badge ${
                      request.status === 'Pending' ? 'badge-pending' :
                      request.status === 'Approved' ? 'badge-paid' :
                      'badge-unpaid'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {request.status === 'Pending' ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'Approved')}
                          disabled={updatingId === request.id}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                          title="Approve Request"
                        >
                          {updatingId === request.id ? <Loader className="animate-spin" size={18} /> : <Check size={18} />}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'Rejected')}
                          disabled={updatingId === request.id}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          title="Reject Request"
                        >
                          {updatingId === request.id ? <Loader className="animate-spin" size={18} /> : <X size={18} />}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        {request.admin_comment && (
                          <p className="italic">"{request.admin_comment}"</p>
                        )}
                        <p className="mt-1">Done by Admin</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRoomChanges;
