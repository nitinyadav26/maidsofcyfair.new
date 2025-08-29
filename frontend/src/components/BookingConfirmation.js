import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Phone, Mail, ArrowLeft, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Load booking details
      const bookingResponse = await axios.get(`${API}/bookings/${bookingId}`);
      const bookingData = bookingResponse.data;
      setBooking(bookingData);

      // Load customer details
      const customerResponse = await axios.get(`${API}/customers/${bookingData.customer_id}`);
      setCustomer(customerResponse.data);

      // Load all services to get details
      const servicesResponse = await axios.get(`${API}/services`);
      const allServices = servicesResponse.data;
      
      // Map booking services with full service details
      const bookingServices = bookingData.services.map(bookingService => {
        const serviceDetails = allServices.find(s => s.id === bookingService.service_id);
        return {
          ...serviceDetails,
          quantity: bookingService.quantity
        };
      });
      setServices(bookingServices);

    } catch (error) {
      console.error('Failed to load booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-white">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect card-shadow">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
            <Link to="/">
              <Button className="btn-hover">
                <ArrowLeft className="mr-2" size={16} />
                Back to Booking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8 fade-in">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-xl text-white/80">
            Thank you for choosing Maids of Cyfair
          </p>
          <p className="text-white/60 mt-2">
            Booking ID: <strong>{booking.id}</strong>
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6 slide-up">
          {/* Booking Status */}
          <Card className="glass-effect card-shadow border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-800">
                  Booking Status
                </CardTitle>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="text-purple-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="text-purple-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-semibold">{booking.time_slot}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="text-purple-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">
                      {customer.address}, {customer.city}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Booked */}
          <Card className="glass-effect card-shadow border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Services Booked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-800">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-sm text-gray-500">Duration: {service.duration_hours} hours</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${service.base_price} × {service.quantity}</p>
                      <p className="text-sm text-gray-600">
                        Total: ${(service.base_price * service.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-purple-600">${booking.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                    <span>Payment Status:</span>
                    <span className={`font-medium ${
                      booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="glass-effect card-shadow border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Contact Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="text-gray-500" size={16} />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="text-gray-500" size={16} />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Service Address</h4>
                  <div className="text-gray-600">
                    <p>{customer.first_name} {customer.last_name}</p>
                    <p>{customer.address}</p>
                    <p>{customer.city}, {customer.state} {customer.zip_code}</p>
                  </div>
                </div>
              </div>
              
              {booking.special_instructions && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Special Instructions</h4>
                  <p className="text-gray-700">{booking.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="glass-effect card-shadow border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <span className="text-purple-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Confirmation Email</h4>
                    <p className="text-gray-600">You'll receive a confirmation email shortly with all booking details.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <span className="text-purple-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Cleaner Assignment</h4>
                    <p className="text-gray-600">We'll assign the best available cleaner and send you their profile.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Day of Service</h4>
                    <p className="text-gray-600">Your cleaner will arrive on time and provide exceptional service.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <span className="text-purple-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Follow-up</h4>
                    <p className="text-gray-600">We'll follow up to ensure you're completely satisfied with our service.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="btn-hover">
              <Download className="mr-2" size={16} />
              Download Receipt
            </Button>
            
            <Link to="/">
              <Button className="btn-hover bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                Book Another Service
              </Button>
            </Link>
          </div>

          {/* Support Information */}
          <Card className="glass-effect card-shadow border-0">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Our customer support team is here to assist you with any questions or concerns.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="sm">
                  <Phone className="mr-2" size={16} />
                  Call (281) 555-0123
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="mr-2" size={16} />
                  Email Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;