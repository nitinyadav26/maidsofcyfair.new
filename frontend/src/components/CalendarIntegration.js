import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarIntegration = ({ cleaners, selectedDate, onDateChange }) => {
  const [availabilityData, setAvailabilityData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [cleanerEvents, setCleanerEvents] = useState([]);
  const [calendarSetup, setCalendarSetup] = useState({
    cleanerId: '',
    credentials: '',
    calendarId: 'primary'
  });

  const timeSlots = [
    '08:00-10:00',
    '10:00-12:00', 
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00'
  ];

  useEffect(() => {
    if (selectedDate) {
      loadAvailabilityData();
    }
  }, [selectedDate]);

  const loadAvailabilityData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/cleaners/availability-summary?date=${selectedDate}`);
      setAvailabilityData(response.data);
    } catch (error) {
      toast.error('Failed to load availability data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setupCalendarIntegration = async () => {
    try {
      let credentials;
      try {
        credentials = JSON.parse(calendarSetup.credentials);
      } catch (e) {
        toast.error('Invalid JSON format for credentials');
        return;
      }

      await axios.post(`${API}/admin/cleaners/${calendarSetup.cleanerId}/calendar/setup`, {
        credentials: credentials,
        calendar_id: calendarSetup.calendarId
      });

      toast.success('Calendar integration setup successfully');
      setCalendarSetup({ cleanerId: '', credentials: '', calendarId: 'primary' });
      loadAvailabilityData();
    } catch (error) {
      toast.error('Failed to setup calendar integration');
      console.error(error);
    }
  };

  const loadCleanerEvents = async (cleanerId) => {
    try {
      const response = await axios.get(`${API}/admin/cleaners/${cleanerId}/calendar/events`);
      setCleanerEvents(response.data.events || []);
      setSelectedCleaner(cleanerId);
    } catch (error) {
      toast.error('Failed to load cleaner events');
      console.error(error);
    }
  };

  const getAvailabilityColor = (isAvailable) => {
    if (isAvailable === undefined) return 'bg-gray-100';
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getAvailabilityIcon = (isAvailable) => {
    if (isAvailable === undefined) return AlertCircle;
    return isAvailable ? CheckCircle : XCircle;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="text-blue-600" size={24} />
            <span>Google Calendar Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <select
                className="w-full p-2 border rounded-lg"
                value={calendarSetup.cleanerId}
                onChange={(e) => setCalendarSetup({...calendarSetup, cleanerId: e.target.value})}
              >
                <option value="">Select Cleaner</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.first_name} {cleaner.last_name}
                  </option>
                ))}
              </select>
              
              <Input
                placeholder="Calendar ID (default: primary)"
                value={calendarSetup.calendarId}
                onChange={(e) => setCalendarSetup({...calendarSetup, calendarId: e.target.value})}
              />
              
              <Textarea
                placeholder="Paste Google Calendar API credentials JSON here"
                rows={4}
                value={calendarSetup.credentials}
                onChange={(e) => setCalendarSetup({...calendarSetup, credentials: e.target.value})}
              />
              
              <Button 
                onClick={setupCalendarIntegration}
                disabled={!calendarSetup.cleanerId || !calendarSetup.credentials}
                className="w-full"
              >
                Setup Calendar Integration
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Setup Instructions</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Go to Google Cloud Console</li>
                <li>2. Enable Google Calendar API</li>
                <li>3. Create OAuth 2.0 credentials</li>
                <li>4. Download credentials JSON</li>
                <li>5. Paste the JSON content above</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date for Availability Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <Button onClick={loadAvailabilityData} disabled={loading}>
              {loading ? 'Loading...' : 'Check Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability Matrix */}
      {availabilityData.cleaners && (
        <Card>
          <CardHeader>
            <CardTitle>Cleaner Availability Matrix - {selectedDate}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Cleaner</th>
                    <th className="border p-2 text-center">Calendar</th>
                    {timeSlots.map((slot) => (
                      <th key={slot} className="border p-2 text-center text-sm">
                        {slot}
                      </th>
                    ))}
                    <th className="border p-2 text-center">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {availabilityData.cleaners.map((cleaner) => (
                    <tr key={cleaner.cleaner_id}>
                      <td className="border p-2">
                        <div>
                          <p className="font-medium">{cleaner.cleaner_name}</p>
                          <p className="text-sm text-gray-500">{cleaner.cleaner_id.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="border p-2 text-center">
                        <Badge 
                          className={cleaner.calendar_enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {cleaner.calendar_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      {timeSlots.map((slot) => {
                        const isAvailable = cleaner.slots[slot];
                        const AvailabilityIcon = getAvailabilityIcon(isAvailable);
                        
                        return (
                          <td key={slot} className="border p-1 text-center">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getAvailabilityColor(isAvailable)}`}>
                              <AvailabilityIcon size={16} />
                            </div>
                          </td>
                        );
                      })}
                      <td className="border p-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadCleanerEvents(cleaner.cleaner_id)}
                        >
                          View Calendar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={12} className="text-green-800" />
                </div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle size={12} className="text-red-800" />
                </div>
                <span>Busy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={12} className="text-gray-800" />
                </div>
                <span>No Calendar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleaner Events Modal */}
      {selectedCleaner && (
        <Dialog open={selectedCleaner !== null} onOpenChange={() => setSelectedCleaner(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Calendar Events - {availabilityData.cleaners?.find(c => c.cleaner_id === selectedCleaner)?.cleaner_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {cleanerEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No events found for the selected period</p>
              ) : (
                cleanerEvents.map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{event.summary}</h4>
                        <Badge>{event.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock size={14} />
                          <span>
                            {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                          </span>
                        </div>
                        {event.description && (
                          <p className="mt-2">{event.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CalendarIntegration;