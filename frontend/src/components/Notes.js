import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Save, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Notes = () => {
  const navigate = useNavigate();
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentAppointment();
  }, []);

  const loadCurrentAppointment = async () => {
    try {
      const response = await axios.get(`${API}/customer/next-appointment`);
      const appointment = response.data;
      setCurrentAppointment(appointment);
      setNotes(appointment?.special_instructions || '');
    } catch (error) {
      console.error('Failed to load current appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentAppointment) return;

    setSaving(true);
    try {
      await axios.put(`${API}/customer/update-notes`, {
        appointment_id: currentAppointment.id,
        special_instructions: notes
      });

      toast.success('Notes saved successfully');
    } catch (error) {
      toast.error('Failed to save notes');
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
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
              <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointment to Add Notes</h3>
              <p className="text-gray-500 mb-4">You don't have any upcoming appointments to add notes to.</p>
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
          <h1 className="text-4xl font-bold text-gray-800">Special Instructions</h1>
          <p className="text-xl text-gray-600 mt-2">Add notes for your upcoming cleaning</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Appointment Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Appointment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">
                        {formatDate(currentAppointment.booking_date)}
                      </div>
                      <div className="text-gray-600">
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

              {/* Tips */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Tips for Better Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <strong>Gate/Door Codes:</strong> Include any access codes or instructions for entry.
                    </div>
                    <div>
                      <strong>Pet Information:</strong> Let us know about any pets and their locations.
                    </div>
                    <div>
                      <strong>Special Areas:</strong> Point out any areas that need extra attention.
                    </div>
                    <div>
                      <strong>Accessibility:</strong> Mention any mobility considerations or restrictions.
                    </div>
                    <div>
                      <strong>Parking:</strong> Include any parking instructions or restrictions.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <MessageSquare className="mr-2" size={20} />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions for your cleaning team
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter special instructions, gate/door codes, pet information, or any other details that will help our team provide the best service..."
                        rows={8}
                        className="resize-none"
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        {notes.length}/500 characters
                      </div>
                    </div>

                    {/* Examples */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Example Instructions:</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>• "Please use the side gate - code is 1234. The dog will be in the backyard."</div>
                        <div>• "Focus extra attention on the kitchen and master bathroom. Please avoid the home office."</div>
                        <div>• "Park in the driveway. The front door key is under the mat. No pets in the house."</div>
                        <div>• "Please clean the basement as well. Use the stairs by the kitchen."</div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveNotes}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-light"
                      >
                        <Save className="mr-2" size={16} />
                        {saving ? 'Saving...' : 'Save Notes'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notice */}
              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> These instructions are tied to your next appointment on{' '}
                  <strong>{formatDate(currentAppointment.booking_date)}</strong>. 
                  If you reschedule, you may need to update your notes.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
