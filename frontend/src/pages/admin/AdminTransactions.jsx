import { useState, useEffect } from 'react';
import { Loader, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/dateFormatter';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [roomTransactions, setRoomTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'byRoom'
  const [expandedRooms, setExpandedRooms] = useState([]);

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (viewMode === 'all') {
        const response = await adminAPI.getTransactions();
        setTransactions(response.data);
      } else {
        const response = await adminAPI.getTransactionsByRoom();
        setRoomTransactions(response.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (roomId) => {
    setExpandedRooms(
      expandedRooms.includes(roomId)
        ? expandedRooms.filter(id => id !== roomId)
        : [...expandedRooms, roomId]
    );
  };

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      await adminAPI.updateTransaction(transactionId, { status: newStatus });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction status');
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
          <h1 className="text-4xl font-bold text-slate-900">Financial Management</h1>
          <p className="text-slate-600 mt-2">Track and manage all financial transactions</p>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="view"
            value="all"
            checked={viewMode === 'all'}
            onChange={(e) => setViewMode(e.target.value)}
            className="w-4 h-4"
          />
          <span className="font-medium text-slate-900">All Transactions</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="view"
            value="byRoom"
            checked={viewMode === 'byRoom'}
            onChange={(e) => setViewMode(e.target.value)}
            className="w-4 h-4"
          />
          <span className="font-medium text-slate-900">View by Room</span>
        </label>
      </div>

      {/* All Transactions View */}
      {viewMode === 'all' && (
        <div className="card overflow-x-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">All Transactions</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No transactions found</p>
              <p className="text-slate-500 text-sm mt-2">Transactions will appear here when students make payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">Total Paid</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{transactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + Number(t.amount || 0), 0)}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium">Pending Dues</p>
                  <p className="text-2xl font-bold text-red-900">
                    ₹{transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + Number(t.amount || 0), 0)}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm font-medium">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-900">{transactions.length}</p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="table-responsive">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Student</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Room</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Month</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {transaction.user_id?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {transaction.room_id?.room_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">₹{transaction.amount}</div>
                          {transaction.status === 'Paid' && (
                            <div className="text-xs text-green-600">✓ Paid</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{transaction.month}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => updateTransactionStatus(transaction.id, transaction.status === 'Paid' ? 'Pending' : 'Paid')}
                            className={`badge cursor-pointer hover:opacity-80 transition-opacity ${
                              transaction.status === 'Paid' ? 'badge-paid' : 'badge-pending-due'
                            }`}
                          >
                            {transaction.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {transaction.status === 'Paid' && transaction.paidDate ? 
                            formatDate(transaction.paidDate) : 
                            '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View by Room */}
      {viewMode === 'byRoom' && (
        <div className="space-y-4">
          {roomTransactions.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-600 text-lg">No rooms found</p>
              <p className="text-slate-500 text-sm mt-2">Rooms will appear here once they are created</p>
            </div>
          ) : (
            roomTransactions.map((roomData) => (
              <div key={roomData.room.id} className="card border-l-4 border-indigo-600">
                <button
                  onClick={() => toggleRoom(roomData.room.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900">
                      Room {roomData.room.room_number} - Wing {roomData.room.wing}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {roomData.room.type} • ₹{roomData.room.price}/month
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">Total Pending Dues</p>
                      <p className="text-2xl font-bold text-red-600">₹{roomData.totalDues}</p>
                      <p className="text-xs text-slate-500">
                        {roomData.transactions.filter(t => t.status === 'Paid').length} paid, {roomData.transactions.filter(t => t.status === 'Pending').length} pending
                      </p>
                    </div>
                    {expandedRooms.includes(roomData.room.id) ? (
                      <ChevronUp className="text-indigo-600" size={24} />
                    ) : (
                      <ChevronDown className="text-slate-400" size={24} />
                    )}
                  </div>
                </button>

                {expandedRooms.includes(roomData.room.id) && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    {roomData.transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-600">No transactions for this room</p>
                        <p className="text-slate-500 text-sm mt-2">Transactions will appear when students make payments</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Room Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-800 text-xs font-medium">Total Paid</p>
                            <p className="text-xl font-bold text-green-900">
                              ₹{roomData.transactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + Number(t.amount || 0), 0)}
                            </p>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-xs font-medium">Pending Dues</p>
                            <p className="text-xl font-bold text-red-900">
                              ₹{roomData.transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + Number(t.amount || 0), 0)}
                            </p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-blue-800 text-xs font-medium">Total Transactions</p>
                            <p className="text-xl font-bold text-blue-900">{roomData.transactions.length}</p>
                          </div>
                        </div>

                        {/* Transaction List */}
                        <div className="space-y-3">
                          {roomData.transactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                transaction.status === 'Paid' 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                  {transaction.user_id?.name}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {transaction.month}
                                </p>
                                {transaction.status === 'Paid' && transaction.paidDate && (
                                  <p className="text-xs text-green-600">
                                    Paid on {formatDate(transaction.paidDate)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <p className="font-bold text-lg text-slate-900">₹{transaction.amount}</p>
                                  {transaction.status === 'Paid' && (
                                    <div className="text-green-600">✓</div>
                                  )}
                                </div>
                                <button
                                  onClick={() => updateTransactionStatus(transaction.id, transaction.status === 'Paid' ? 'Pending' : 'Paid')}
                                  className={`badge text-xs inline-block mt-1 cursor-pointer hover:opacity-80 transition-opacity ${
                                    transaction.status === 'Paid' ? 'badge-paid' : 'badge-pending-due'
                                  }`}
                                >
                                  {transaction.status}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
