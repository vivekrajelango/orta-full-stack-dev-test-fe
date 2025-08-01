import React, { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";
import CalendarView from './CalendarView';

export default function Dashboard() {
  const { userToken, user } = useContext(TokenContext);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'calendar' or 'table'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Scheduled', 'In Progress', 'Completed'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!userToken || !user?._id) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get("/shifts", {
        params: { userId: user._id },
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      // Sort shifts by date in chronological order
      const sortedShifts = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setShifts(sortedShifts);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || "Failed to load shifts"
      );
    } finally {
      setLoading(false);
    }
  }, [userToken, user]);

  // Handle shift update callback
  const handleShiftUpdate = () => {
    fetchShifts();
  };

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  };

  const getShiftStatus = (shift) => {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) {
      return 'Completed';
    } else if (shiftDate.getTime() === today.getTime()) {
      return 'In Progress';
    } else {
      return 'Scheduled';
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Completed':
        return `${baseClasses} bg-gray-800 text-white`;
      case 'In Progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Scheduled':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleStatusFilter = () => {
    const statusOrder = ['all', 'Scheduled', 'In Progress', 'Completed'];
    const currentIndex = statusOrder.indexOf(statusFilter);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    setStatusFilter(statusOrder[nextIndex]);
  };

  const getFilteredShifts = () => {
    let filteredShifts = shifts;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filteredShifts = filteredShifts.filter(shift => getShiftStatus(shift) === statusFilter);
    }
    
    // Filter by search query (shift name or status)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredShifts = filteredShifts.filter(shift => {
        const shiftTitle = (shift.title || 'Morning Shift').toLowerCase();
        const shiftStatus = getShiftStatus(shift).toLowerCase();
        return shiftTitle.includes(query) || shiftStatus.includes(query);
      });
    }
    
    return filteredShifts;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading shifts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error loading shifts: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Shifts</h1>
            <p className="text-gray-600">View and manage your scheduled shifts. Switch between calendar and table view.</p>
          </div>
          <Link
            to="/create-shift"
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block"
          >
            Create Shift
          </Link>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calendar View
          </button>
        </div>

        {/* Content Section */}
        {viewMode === 'calendar' ? (
          <CalendarView shifts={shifts} onShiftUpdate={handleShiftUpdate} user={user} userToken={userToken} />
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Shifts</h2>
                  <p className="text-sm text-gray-600 mt-1">Your scheduled shifts in chronological order</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-64 pl-10 pr-3 p-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  {(searchQuery.trim() || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear all filters"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {shifts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500 mb-2">No shifts found</div>
                <Link to="/create-shift" className="text-blue-600 hover:text-blue-700 font-medium">
                  Create your first shift
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={handleStatusFilter}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors group"
                        >
                          <span>Status</span>
                          {statusFilter !== 'all' && (
                            <span className="text-blue-600 text-xs font-semibold">({statusFilter})</span>
                          )}
                          <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredShifts().map((shift) => {
                      const status = getShiftStatus(shift);
                      return (
                        <tr key={shift._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(shift.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.title || 'Morning Shift'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(shift.startTime, shift.finishTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div>
                                <div className="font-medium">{shift.location?.name || 'Clippers Quay Office'}</div>
                                <div className="text-xs text-gray-500">
                                  {shift.location?.address || 'Clippers Quay, Manchester M50 3XP'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(status)}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <Link
                              to={`/shift/${shift._id}`}
                              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      

    </div>
  );
}