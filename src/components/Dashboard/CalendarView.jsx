import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../Axios/axios';

const CalendarView = ({ shifts, onShiftUpdate, user, userToken }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedShift, setDraggedShift] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Keyboard event handlers for Ctrl key detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Navigate to previous/next month
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentMonth + direction);
    setCurrentDate(newDate);
  };
  
  // Get shifts for a specific date
  const getShiftsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.date).toISOString().split('T')[0];
      return shiftDate === dateStr;
    });
  };
  
  // Handle drag start
  const handleDragStart = (e, shift) => {
    const ctrlPressed = e.ctrlKey || e.metaKey;
    setDraggedShift(shift);
    setIsDragging(true);
    // Use existing copy mode or ctrl key
    const finalCopyMode = ctrlPressed || isCopyMode;
    setIsCopyMode(finalCopyMode);
    e.dataTransfer.effectAllowed = finalCopyMode ? 'copy' : 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };
  
  // Create a copy of a shift
  const createShiftCopy = async (originalShift, newDate) => {
    try {
      
      const payload = {
        title: originalShift.title || 'Copied Shift',
        role: originalShift.role || 'Support Worker',
        typeOfShift: originalShift.typeOfShift || ['Weekdays'],
        startTime: originalShift.startTime,
        finishTime: originalShift.finishTime,
        numOfShiftsPerDay: originalShift.numOfShiftsPerDay || 1,
        location: typeof originalShift.location === 'string' 
          ? originalShift.location 
          : originalShift.location?._id || '',
        date: newDate,
        user: user?._id
      };
      
      const response = await axios.post('/shifts', payload, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (onShiftUpdate) {
        onShiftUpdate();
      }
    } catch (error) {
      console.error('Error creating shift copy:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to create shift copy: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isCopyMode ? 'copy' : 'move';
    setDragOverDate(day);
  };
  
  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverDate(null);
  };
  
  // Handle drop
  const handleDrop = async (e, day) => {
    e.preventDefault();
    setDragOverDate(null);
    setIsDragging(false);
    
    
    if (!draggedShift) {
      return;
    }
    
    const newDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const originalDate = new Date(draggedShift.date).toISOString().split('T')[0];
    
    
    // Handle copy mode or move mode
    if (isCopyMode) {
      await createShiftCopy(draggedShift, newDate);
    } else if (newDate !== originalDate) {
      try {
        const payload = {
          title: draggedShift.title,
          role: draggedShift.role,
          typeOfShift: draggedShift.typeOfShift,
          startTime: draggedShift.startTime,
          finishTime: draggedShift.finishTime,
          numOfShiftsPerDay: draggedShift.numOfShiftsPerDay,
          location: typeof draggedShift.location === 'string' ? draggedShift.location : draggedShift.location?._id || '',
          date: newDate
        };
        
        await axios.put(`/shifts/${draggedShift._id}`, payload, {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Call parent component to refresh shifts
        if (onShiftUpdate) {
          onShiftUpdate();
        }
      } catch (error) {
        console.error('Error updating shift:', error);
        alert('Failed to update shift. Please try again.');
      }
    }
    
    setDraggedShift(null);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedShift(null);
    setDragOverDate(null);
    setIsDragging(false);
  };
  
  // Format time for display
  const formatTime = (startTime, finishTime) => {
    const formatSingleTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    if (startTime && finishTime) {
      return `${formatSingleTime(startTime)} - ${formatSingleTime(finishTime)}`;
    } else if (startTime) {
      return formatSingleTime(startTime);
    }
    return '';
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayShifts = getShiftsForDate(day);
      const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
      
      const isDragOver = dragOverDate === day;
      
      days.push(
        <div 
          key={day} 
          className={`h-32 border border-gray-200 p-1 transition-colors ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } ${isDragOver ? 'bg-yellow-50 border-yellow-300' : ''}`}
          onDragOver={(e) => handleDragOver(e, day)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, day)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayShifts.map((shift, index) => {
              const isSelected = shift.status === 'confirmed';
              const isBeingDragged = draggedShift && draggedShift._id === shift._id;
              
              return (
                <div
                  key={shift._id}
                  className={`relative group block text-xs p-1 rounded text-left transition-all ${
                    isSelected 
                      ? 'bg-green-100 border border-green-300 text-green-800 hover:bg-green-200'
                      : 'bg-blue-100 border border-blue-300 text-blue-800 hover:bg-blue-200'
                  } ${isBeingDragged ? 'opacity-50 transform scale-95' : ''} ${isDragging && !isBeingDragged ? 'pointer-events-none' : ''} ${isCopyMode && isBeingDragged ? 'ring-2 ring-orange-400 ring-opacity-75' : ''}`}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, shift)}
                    onDragEnd={handleDragEnd}
                    className="cursor-move"
                  >
                    <Link
                      to={`/shift/${shift._id}`}
                      className="block"
                      onClick={(e) => {
                        if (isDragging) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="font-medium truncate">
                        {formatTime(shift.startTime)} {shift.title || 'Morning Shift'}
                      </div>
                      {shift.location?.name && (
                        <div className="text-xs opacity-75 truncate">
                          {shift.location.name}
                        </div>
                      )}
                    </Link>
                  </div>
                  <div className="absolute top-0 right-0 flex space-x-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Copy button clicked for shift:', shift._id);
                        setIsCopyMode(true);
                        setDraggedShift(shift);
                        console.log('Copy mode set to true, draggedShift set');
                      }}
                      className="p-0.5 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                      title="Copy shift (or hold Ctrl while dragging)"
                    >
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <div className="p-0.5">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Copy Mode Indicator */}
      {(isCopyMode || isCtrlPressed) && (
        <div className="px-6 py-2 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-orange-800">
              Copy Mode Active - Drop shift on any date to create a duplicate
            </span>
          </div>
          {isCopyMode && (
            <button
              onClick={() => {
                setIsCopyMode(false);
                setDraggedShift(null);
              }}
              className="text-orange-600 hover:text-orange-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-6">
        {/* Instructions */}
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600">
            <strong>Drag & Drop:</strong> Move shifts between dates<br/>
            <strong>Copy:</strong> click the copy icon to duplicate shifts
          </p>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200">
          {generateCalendarDays()}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;