import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";

export default function ShiftDetails() { console.log('test')
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken, user } = useContext(TokenContext);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime] = useState("19:53:05");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, shiftTitle: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchShift = async () => {
      setLoading(true);
      setError(null);

      if (!userToken || !user?._id) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`/shifts/${id}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        setShift(data);
        // Check if already clocked in (static for now)
        setClockedIn(true);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || err.message || "Failed to load shift details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchShift();
  }, [id, userToken, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
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

  const handleDeleteShift = () => {
    setDeleteConfirm({
      show: true,
      shiftTitle: shift?.title || 'this shift'
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/shifts/${id}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      // Close the confirmation dialog and navigate back
      setDeleteConfirm({ show: false, shiftTitle: '' });
      navigate('/');
    } catch (err) {
      console.error('Failed to delete shift:', err);
      setError(err.response?.data?.message || 'Failed to delete shift');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, shiftTitle: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading shift details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error loading shift details: {error}</div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Shift not found</div>
      </div>
    );
  }

  const status = getShiftStatus(shift);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Shift Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Shift Information */}
          <div className="space-y-6">
            {/* Shift Title and Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {shift.title || 'Morning Shift'}
                </h2>
                <span className={getStatusBadge(status)}>
                  {status}
                </span>
              </div>
              <p className="text-gray-600">
                {formatDate(shift.date)}
              </p>
            </div>

            {/* Time Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold text-gray-900">
                  {formatTime(shift.startTime, shift.finishTime)}
                </span>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {shift.location?.name || 'Clippers Quay Office'}
                  </h3>
                  <p className="text-gray-600">
                    {shift.location?.address || 'Clippers Quay, Manchester M50 3XP'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Distance: 4533m away
                  </p>
                </div>
              </div>
            </div>

            {/* Shift Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift Management</h3>
              <p className="text-gray-600 mb-4">Administrative actions for this shift</p>
              <div className="flex space-x-3">
                <Link
                  to={`/edit-shift/${shift._id}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Edit Shift
                </Link>
                <button
                  onClick={handleDeleteShift}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
                >
                  Delete Shift
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Clock In/Out */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Clock In/Out</h3>
              <p className="text-gray-600 mb-6">Manage your shift attendance</p>

              {/* Clock In Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Clock In</h4>
                  {clockedIn && (
                    <span className="bg-gray-900 text-white px-3 py-1 rounded text-sm font-medium">
                      {clockInTime}
                    </span>
                  )}
                </div>
                
                {clockedIn ? (
                  <div>
                    <p className="text-gray-600 mb-2">Clocked in</p>
                    <p className="text-sm text-gray-500">Already clocked in</p>
                  </div>
                ) : (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition-colors">
                    Clock In
                  </button>
                )}
              </div>

              {/* Clock Out Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Clock Out</h4>
                
                {clockedIn ? (
                  <div>
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-md font-medium transition-colors mb-3">
                      Clock Out
                    </button>
                    <p className="text-sm text-gray-500 text-center">
                      Clock-out available 327 minutes before shift ends
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Please clock in first</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Shift</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{deleteConfirm.shiftTitle}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}