import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CreditCard, Home, Phone, FileText, Settings, Plus, Edit, DollarSign, History, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load next appointment
      const appointmentResponse = await axios.get(`${API}/customer/next-appointment`);
      setNextAppointment(appointmentResponse.data);

      // Load upcoming appointments (next month)
      const upcomingResponse = await axios.get(`${API}/customer/upcoming-appointments`);
      setUpcomingAppointments(upcomingResponse.data);

      // Load payment methods
      const paymentResponse = await axios.get(`${API}/customer/payment-methods`);
      setPaymentMethods(paymentResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  const formatTime = (timeString) => {
    return timeString;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {getGreeting()}, {user?.first_name || 'Customer'}!
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Welcome to your cleaning service portal
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/book')}
                className="bg-primary hover:bg-primary-light text-white px-6 py-3 text-lg font-semibold"
              >
                <Plus className="mr-2" size={20} />
                Book Appointment
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Next Appointment Card */}
            {nextAppointment ? (
              <Card className="border-2 border-primary">
                <CardHeader className="bg-primary text-white">
                  <CardTitle className="text-2xl flex items-center">
                    <Calendar className="mr-2" size={24} />
                    Next Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-800">
                          {formatDate(nextAppointment.booking_date)}
                        </div>
                        <div className="text-lg text-gray-600 flex items-center mt-1">
                          <Clock className="mr-2" size={18} />
                          {formatTime(nextAppointment.time_slot)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          ${nextAppointment.total_amount?.toFixed(2) || '0.00'}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {nextAppointment.frequency?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Selected Rooms & Add-ons */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Service Details:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">House Size:</span>
                          <span className="font-medium">{nextAppointment.house_size} sq ft</span>
                        </div>
                        {nextAppointment.rooms && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rooms:</span>
                            <span className="font-medium">
                              {Object.entries(nextAppointment.rooms)
                                .filter(([key, value]) => value === true || (typeof value === 'number' && value > 0))
                                .map(([key, value]) => {
                                  if (typeof value === 'number') {
                                    return `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`;
                                  }
                                  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                })
                                .join(', ')}
                            </span>
                          </div>
                        )}
                        {nextAppointment.special_instructions && (
                          <div className="mt-2">
                            <span className="text-gray-600">Notes:</span>
                            <p className="text-sm text-gray-700 mt-1">{nextAppointment.special_instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/reschedule')}
                        className="flex items-center"
                      >
                        <Calendar className="mr-2" size={16} />
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/edit-cleaning')}
                        className="flex items-center"
                      >
                        <Edit className="mr-2" size={16} />
                        Edit Cleaning
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/payment')}
                        className="flex items-center"
                      >
                        <CreditCard className="mr-2" size={16} />
                        Update Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/notes')}
                        className="flex items-center"
                      >
                        <MessageSquare className="mr-2" size={16} />
                        Leave Notes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Upcoming Appointments</h3>
                  <p className="text-gray-500 mb-4">You don't have any scheduled cleanings.</p>
                  <Button
                    onClick={() => navigate('/book')}
                    className="bg-primary hover:bg-primary-light text-white"
                  >
                    <Plus className="mr-2" size={16} />
                    Book Your First Cleaning
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="mr-2" size={20} />
                    Upcoming Appointments (Next Month)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 3).map((appointment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">
                            {formatDate(appointment.booking_date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(appointment.time_slot)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">
                            ${appointment.total_amount?.toFixed(2) || '0.00'}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {appointment.frequency?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {upcomingAppointments.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{upcomingAppointments.length - 3} more appointments
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/payment-history')}
                >
                  <History className="mr-2" size={16} />
                  View Payment History
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/upcoming')}
                >
                  <Calendar className="mr-2" size={16} />
                  Upcoming Appointments
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('tel:+1234567890')}
                >
                  <Phone className="mr-2" size={16} />
                  Contact Office
                </Button>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="mr-2" size={18} />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CreditCard className="mr-2" size={16} />
                          <span className="text-sm font-medium">
                            **** **** **** {method.last_four}
                          </span>
                          {method.is_primary && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/payment')}
                    >
                      <Plus className="mr-2" size={14} />
                      Add New Card
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">No payment methods on file</p>
                    <Button
                      size="sm"
                      onClick={() => navigate('/payment')}
                      className="bg-primary hover:bg-primary-light"
                    >
                      <Plus className="mr-2" size={14} />
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Phone className="mr-2" size={16} />
                    <span>(XXX) XXX-XXXX</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="mr-2" size={16} />
                    <span>support@maidsofcyfair.com</span>
                  </div>
                  <p className="text-gray-600 text-xs">
                    Available Monday-Friday 8AM-6PM
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
