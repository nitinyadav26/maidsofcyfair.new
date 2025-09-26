import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, AlertTriangle, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RescheduleAppointment = () => {
  const navigate = useNavigate();
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCurrentAppointment();
    loadAvailableDates();
  }, []);

  const loadCurrentAppointment = async () => {
    try {
      const response = await axios.get(`${API}/customer/next-appointment`);
      setCurrentAppointment(response.data);
    } catch (error) {
      console.error('Failed to load current appointment:', error);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const response = await axios.get(`${API}/available-dates`);
      setAvailableDates(response.data);
    } catch (error) {
      console.error('Failed to load available dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async (date) => {
    try {
      const response = await axios.get(`${API}/time-slots?date=${date}`);
      setTimeSlots(response.data);
    } catch (error) {
      console.error('Failed to load time slots:', error);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    loadTimeSlots(date);
  };

  const isWithin48Hours = (dateString) => {
    const appointmentDate = new Date(dateString);
    const now = new Date();
    const diffHours = (appointmentDate - now) / (1000 * 60 * 60);
    return diffHours < 48;
  };

  const isTimeUnavailable = (timeSlot) => {
    // This would check against actual availability
    // For now, we'll simulate some unavailable slots
    return false;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTimeSlot) return;

    setSubmitting(true);
    try {
      await axios.put(`${API}/customer/reschedule-appointment`, {
        appointment_id: currentAppointment.id,
        new_date: selectedDate,
        new_time_slot: selectedTimeSlot
      });

      navigate('/');
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentAppointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointment to Reschedule</h3>
              <p className="text-gray-500 mb-4">You don't have any upcoming appointments to reschedule.</p>
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="mr-2" size={16} />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-800">Reschedule Appointment</h1>
          <p className="text-xl text-gray-600 mt-2">Select a new date and time for your cleaning</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Appointment Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Appointment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatDate(currentAppointment.booking_date)}
                    </div>
                    <div className="text-gray-600 flex items-center">
                      <Clock className="mr-2" size={16} />
                      {currentAppointment.time_slot}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold text-primary">
                        ${currentAppointment.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Select New Date (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 48 Hour Warning */}
                {isWithin48Hours(currentAppointment.booking_date) && (
                  <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Rescheduling Notice:</strong> Rescheduling online is only available up to 48 hours in advance. 
                      Please text our office at <strong>(XXX) XXX-XXXX</strong> for assistance.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Available Dates */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Dates</h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {availableDates.slice(0, 30).map((date) => {
                      const dateObj = new Date(date);
                      const isSelected = selectedDate === date;
                      const isPast = new Date(date) < new Date();
                      
                      return (
                        <Card 
                          key={date}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-2 border-primary bg-primary/5' 
                              : isPast 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => !isPast && handleDateSelect(date)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-500 mb-1">
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-lg font-semibold text-gray-800">
                              {dateObj.getDate()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && timeSlots.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Available Times for {formatDate(selectedDate)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {timeSlots.map((slot) => {
                        const timeSlotString = `${slot.start_time}-${slot.end_time}`;
                        const isSelected = selectedTimeSlot === timeSlotString;
                        const isUnavailable = isTimeUnavailable(slot);
                        
                        return (
                          <Card 
                            key={`${slot.start_time}-${slot.end_time}`}
                            className={`cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-2 border-primary bg-primary/5' 
                                : isUnavailable 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => !isUnavailable && setSelectedTimeSlot(timeSlotString)}
                          >
                            <CardContent className="p-4 text-center">
                              <Clock className="mx-auto mb-2 text-primary" size={20} />
                              <div className="font-semibold text-gray-800">
                                {slot.start_time} - {slot.end_time}
                              </div>
                              {isUnavailable && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Unavailable
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Unavailable Time Message */}
                    {timeSlots.every(slot => isTimeUnavailable(slot)) && (
                      <Alert className="mt-4 border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          This time is currently unavailable. Please call our office at{' '}
                          <strong>(XXX) XXX-XXXX</strong> and we'll try to work something out.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReschedule}
                    disabled={!selectedDate || !selectedTimeSlot || submitting}
                    className="bg-primary hover:bg-primary-light"
                  >
                    {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleAppointment;
