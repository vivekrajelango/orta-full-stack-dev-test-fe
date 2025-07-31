import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";

export default function EditShift() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userToken, user } = useContext(TokenContext);
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    typeOfShift: [],
    date: '',
    startTime: '',
    finishTime: '',
    numOfShiftsPerDay: 1,
    location: '',
    locationDetails: {
      name: '',
      address: '',
      postCode: '',
      latitude: '',
      longitude: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShift = async () => {
      setFetchLoading(true);
      setError(null);

      if (!userToken || !user?._id) {
        setError("Not authenticated");
        setFetchLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`/shifts/${id}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        
        // Format date for input field
        const formattedDate = new Date(data.date).toISOString().split('T')[0];
        
        setFormData({
          title: data.title || '',
          role: data.role || '',
          typeOfShift: data.typeOfShift || [],
          date: formattedDate,
          startTime: data.startTime || '',
          finishTime: data.finishTime || '',
          numOfShiftsPerDay: data.numOfShiftsPerDay || 1,
          location: typeof data.location === 'string' ? data.location : data.location?._id || '',
          locationDetails: {
            name: data.location?.name || '',
            address: data.location?.address || '',
            postCode: data.location?.postCode || '',
            latitude: data.location?.latitude || '53.4692',
            longitude: data.location?.longitude || '-2.2955'
          }
        });
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || err.message || "Failed to load shift details"
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchShift();
  }, [id, userToken, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('locationDetails.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        locationDetails: {
          ...prev.locationDetails,
          [locationField]: value
        }
      }));
    } else if (name === 'typeOfShift') {
      setFormData(prev => ({
        ...prev,
        typeOfShift: checked 
          ? [...prev.typeOfShift, value]
          : prev.typeOfShift.filter(item => item !== value)
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseInt(value) || 0 : value 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        role: formData.role,
        typeOfShift: formData.typeOfShift,
        startTime: formData.startTime,
        finishTime: formData.finishTime,
        numOfShiftsPerDay: formData.numOfShiftsPerDay,
        location: formData.location,
        date: formData.date
      };
      
      await axios.put(`/shifts/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      navigate(`/shift/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to update shift');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading shift details...</div>
      </div>
    );
  }

  const calculateDuration = () => {
    if (formData.startTime && formData.finishTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const finish = new Date(`2000-01-01T${formData.finishTime}`);
      const diffMs = finish - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 ? diffHours.toFixed(1) : 0;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Edit Shift Details</h1>
            <p className="text-sm text-gray-600 mt-1">Update the shift information below.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <p className="text-sm text-gray-600 ml-7">Enter the basic details for this shift</p>
              
              <div className="ml-7 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Shift Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Morning Shift"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Senior Support Worker"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Shift
                  </label>
                  <div className="space-y-2">
                    {['Weekdays', 'Weekends', 'Nights', 'Holidays'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          name="typeOfShift"
                          value={type}
                          checked={formData.typeOfShift.includes(type)}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="numOfShiftsPerDay" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Shifts Per Day
                  </label>
                  <input
                    type="number"
                    id="numOfShiftsPerDay"
                    name="numOfShiftsPerDay"
                    value={formData.numOfShiftsPerDay}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Details Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Schedule Details</h3>
              </div>
              <p className="text-sm text-gray-600 ml-7">Set the date and time for this shift</p>
              
              <div className="ml-7 space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="finishTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Finish Time *
                    </label>
                    <input
                      type="time"
                      id="finishTime"
                      name="finishTime"
                      value={formData.finishTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                {formData.startTime && formData.finishTime && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-600">Duration: </span>
                    <span className="text-sm font-medium text-gray-900">{calculateDuration()} hours</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Details Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
              </div>
              <p className="text-sm text-gray-600 ml-7">Specify where this shift will take place</p>
              
              <div className="ml-7 space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location ID
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    disabled="true"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="6887c3aa85079f3dd97694e8"
                    className="w-full px-3 py-2 border border-gray-300 text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="locationDetails.name" className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    id="locationDetails.name"
                    name="locationDetails.name"
                    value={formData.locationDetails.name}
                    onChange={handleChange}
                    placeholder="Clippers Quay Office"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="locationDetails.address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    id="locationDetails.address"
                    name="locationDetails.address"
                    value={formData.locationDetails.postCode}
                    onChange={handleChange}
                    placeholder="Clippers Quay, Manchester M50 3XP"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="locationDetails.latitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="locationDetails.latitude"
                      name="locationDetails.latitude"
                      value={formData.locationDetails.latitude}
                      onChange={handleChange}
                      placeholder="53.4692"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="locationDetails.longitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="locationDetails.longitude"
                      name="locationDetails.longitude"
                      value={formData.locationDetails.longitude}
                      onChange={handleChange}
                      placeholder="-2.2955"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/shift/${id}`)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Shift'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}