import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  Home, 
  MapPin,
  Repeat,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Draggable Job Card Component
const DraggableJobCard = ({ job }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: job.id,
    data: {
      type: 'job',
      job: job
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.6 : 1,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-sm">#{job.id.slice(-8)}</h4>
            <p className="text-xs text-gray-500">Customer: {job.customer_id}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {job.estimated_duration_hours}h
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{job.booking_date}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            <span>{job.time_slot}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <Home className="w-3 h-3 mr-1" />
            <span>{job.house_size}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <Repeat className="w-3 h-3 mr-1" />
            <span>{job.frequency.replace('_', ' ')}</span>
          </div>
          
          <div className="flex items-center text-xs font-medium text-green-600">
            <DollarSign className="w-3 h-3 mr-1" />
            <span>${job.total_amount}</span>
          </div>
          
          {job.address && (
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{job.address.city}, {job.address.state}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Droppable Calendar Cell Component
const DroppableCalendarCell = ({ cleaner, timeSlot, date, isAvailable, existingJobs }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `${cleaner.cleaner_id}-${timeSlot}`,
    data: {
      type: 'calendar-slot',
      cleanerId: cleaner.cleaner_id,
      timeSlot: timeSlot,
      date: date,
      isAvailable: isAvailable
    }
  });

  const getCellColor = () => {
    if (existingJobs.length > 0) return 'bg-red-100 border-red-200';
    if (isAvailable === false) return 'bg-red-50 border-red-100';
    if (isAvailable === true) return 'bg-green-50 border-green-100';
    return 'bg-gray-50 border-gray-200';
  };

  const getIcon = () => {
    if (existingJobs.length > 0) return <XCircle className="w-4 h-4 text-red-600" />;
    if (isAvailable === false) return <XCircle className="w-4 h-4 text-red-500" />;
    if (isAvailable === true) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        relative h-20 border-2 rounded-lg transition-all duration-200
        ${getCellColor()}
        ${isOver ? 'border-blue-400 bg-blue-100' : ''}
        ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div className="flex justify-center">
          {getIcon()}
        </div>
        
        {existingJobs.length > 0 && (
          <div className="text-xs text-center">
            <Badge variant="secondary" className="text-xs">
              {existingJobs.length} job{existingJobs.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
        
        <div className="text-xs text-center text-gray-600">
          {timeSlot}
        </div>
      </div>
    </div>
  );
};

// Main Calendar Job Assignment Component
const CalendarJobAssignment = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [unassignedJobs, setUnassignedJobs] = useState([]);
  const [cleanerAvailability, setCleanerAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedJob, setDraggedJob] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const timeSlots = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"];

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUnassignedJobs(),
        loadCleanerAvailability()
      ]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUnassignedJobs = async () => {
    try {
      const response = await axios.get(`${API}/admin/calendar/unassigned-jobs`);
      setUnassignedJobs(response.data.unassigned_jobs || []);
    } catch (error) {
      console.error('Failed to load unassigned jobs:', error);
    }
  };

  const loadCleanerAvailability = async () => {
    try {
      const response = await axios.get(`${API}/admin/calendar/availability-summary?date=${selectedDate}`);
      setCleanerAvailability(response.data.cleaners || []);
    } catch (error) {
      console.error('Failed to load cleaner availability:', error);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'job') {
      setDraggedJob(active.data.current.job);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setDraggedJob(null);

    if (!over || !active.data.current?.job) return;

    const job = active.data.current.job;
    const dropData = over.data.current;

    if (dropData?.type === 'calendar-slot') {
      const { cleanerId, timeSlot, isAvailable } = dropData;
      
      if (!isAvailable) {
        toast.error('This time slot is not available');
        return;
      }

      // Show confirmation dialog
      setConfirmDialog({
        job,
        cleanerId,
        timeSlot,
        date: selectedDate
      });
    }
  };

  const confirmAssignment = async () => {
    if (!confirmDialog) return;

    try {
      const { job, cleanerId, timeSlot } = confirmDialog;
      
      // Parse time slot to create start and end times
      const [startTimeStr, endTimeStr] = timeSlot.split('-');
      const startTime = new Date(`${selectedDate}T${startTimeStr}:00`);
      const endTime = new Date(`${selectedDate}T${endTimeStr}:00`);

      const assignmentData = {
        booking_id: job.id,
        cleaner_id: cleanerId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: assignmentNotes
      };

      await axios.post(`${API}/admin/calendar/assign-job`, assignmentData);
      
      toast.success('Job assigned successfully');
      setConfirmDialog(null);
      setAssignmentNotes('');
      
      // Reload data
      await loadData();
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign job');
    }
  };

  const getExistingJobsForSlot = (cleanerId, timeSlot) => {
    // This would typically come from the availability data
    // For now, returning empty array as placeholder
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendar Job Assignment</h2>
          <p className="text-gray-600">Drag jobs to assign them to cleaner schedules</p>
        </div>
        <Button onClick={loadData} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Assignment Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border rounded-md"
            />
            <Badge variant="outline">
              {cleanerAvailability.length} cleaners available
            </Badge>
          </div>
        </CardContent>
      </Card>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Unassigned Jobs Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Unassigned Jobs ({unassignedJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unassignedJobs.map((job) => (
                    <DraggableJobCard key={job.id} job={job} />
                  ))}
                  {unassignedJobs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>All jobs assigned!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Cleaner Schedules - {selectedDate}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-3 text-left bg-gray-50 min-w-32">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Cleaner
                            </div>
                          </th>
                          {timeSlots.map((slot) => (
                            <th key={slot} className="border p-3 text-center bg-gray-50 min-w-24">
                              <div className="text-sm font-medium">
                                {slot}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cleanerAvailability.map((cleaner) => (
                          <tr key={cleaner.cleaner_id}>
                            <td className="border p-3">
                              <div>
                                <p className="font-medium text-sm">{cleaner.cleaner_name}</p>
                                <div className="flex items-center mt-1">
                                  <Badge 
                                    className={`text-xs ${
                                      cleaner.calendar_enabled 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {cleaner.calendar_enabled ? 'Connected' : 'No Calendar'}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            {timeSlots.map((slot) => {
                              const isAvailable = cleaner.slots[slot];
                              const existingJobs = getExistingJobsForSlot(cleaner.cleaner_id, slot);
                              
                              return (
                                <td key={slot} className="border p-2">
                                  <DroppableCalendarCell
                                    cleaner={cleaner}
                                    timeSlot={slot}
                                    date={selectedDate}
                                    isAvailable={isAvailable}
                                    existingJobs={existingJobs}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {cleanerAvailability.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                        <p>No cleaners found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedJob ? (
            <Card className="opacity-90 rotate-3 shadow-2xl">
              <CardContent className="p-4">
                <div className="text-sm font-medium">#{draggedJob.id.slice(-8)}</div>
                <div className="text-xs text-gray-500">{draggedJob.house_size}</div>
                <div className="text-xs text-green-600">${draggedJob.total_amount}</div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Assignment Confirmation Dialog */}
      {confirmDialog && (
        <Dialog open={true} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Job Assignment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Job Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Job ID: #{confirmDialog.job.id.slice(-8)}</div>
                  <div>Amount: ${confirmDialog.job.total_amount}</div>
                  <div>House Size: {confirmDialog.job.house_size}</div>
                  <div>Duration: {confirmDialog.job.estimated_duration_hours}h</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Assignment Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Date: {confirmDialog.date}</div>
                  <div>Time: {confirmDialog.timeSlot}</div>
                  <div className="col-span-2">
                    Cleaner: {cleanerAvailability.find(c => c.cleaner_id === confirmDialog.cleanerId)?.cleaner_name}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assignment Notes (Optional)</label>
                <Textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add any special notes for this assignment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialog(null)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmAssignment}>
                  Confirm Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Busy/Unavailable</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span>No Calendar Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Has Existing Jobs</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarJobAssignment;