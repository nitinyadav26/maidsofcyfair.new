import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Home, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Package,
  FileText,
  CheckCircle,
  UserCheck,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingDetailsModal = ({ booking, isOpen, onClose, cleaners, services, onBookingUpdate }) => {
  const [customerDetails, setCustomerDetails] = useState(null);
  const [serviceDetails, setServiceDetails] = useState([]);
  const [aLaCarteDetails, setALaCarteDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking && isOpen) {
      loadBookingDetails();
    }
  }, [booking, isOpen]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      // Load customer details
      const customerResponse = await axios.get(`${API}/customers/${booking.customer_id}`);
      setCustomerDetails(customerResponse.data);

      // Map service IDs to service details
      const standardServices = [];
      const aLaCarteServices = [];

      // Process standard services
      if (booking.services) {
        for (const bookingService of booking.services) {
          const service = services.find(s => s.id === bookingService.service_id);
          if (service) {
            standardServices.push({
              ...service,
              quantity: bookingService.quantity,
              special_instructions: bookingService.special_instructions
            });
          }
        }
      }

      // Process a la carte services
      if (booking.a_la_carte_services) {
        for (const bookingService of booking.a_la_carte_services) {
          const service = services.find(s => s.id === bookingService.service_id);
          if (service) {
            aLaCarteServices.push({
              ...service,
              quantity: bookingService.quantity,
              special_instructions: bookingService.special_instructions
            });
          }
        }
      }

      setServiceDetails(standardServices);
      setALaCarteDetails(aLaCarteServices);
    } catch (error) {
      toast.error('Failed to load booking details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const assignCleaner = async (cleanerId) => {
    try {
      await axios.patch(`${API}/admin/bookings/${booking.id}`, { cleaner_id: cleanerId });
      
      // Try to create calendar event
      try {
        await axios.post(`${API}/admin/bookings/${booking.id}/create-calendar-event`);
        toast.success('Cleaner assigned and calendar event created');
      } catch (calendarError) {
        toast.success('Cleaner assigned (calendar event creation failed)');
      }
      
      onBookingUpdate();
    } catch (error) {
      toast.error('Failed to assign cleaner');
    }
  };

  const updateStatus = async (status) => {
    try {
      await axios.patch(`${API}/admin/bookings/${booking.id}`, { status });
      toast.success('Booking status updated');
      onBookingUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border-0`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatFrequency = (frequency) => {
    const frequencyMap = {
      'one_time': 'One Time Deep Clean / Move Out',
      'monthly': 'Monthly',
      'every_3_weeks': 'Every 3 Weeks',
      'bi_weekly': 'Bi-Weekly',
      'weekly': 'Weekly'
    };
    return frequencyMap[frequency] || frequency;
  };

  const formatHouseSize = (size) => {
    return size.replace('-', ' - ') + ' sq ft';
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">
                Booking #{booking.id.substring(0, 8)}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusBadge(booking.status)}
                <Badge variant="outline">
                  {booking.payment_status}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="text-blue-600" size={20} />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customerDetails ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-500" />
                        <span className="font-medium">
                          {customerDetails.first_name} {customerDetails.last_name}
                        </span>
                        {customerDetails.is_guest && (
                          <Badge variant="outline" className="text-xs">Guest</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-500" />
                        <span>{customerDetails.email}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-500" />
                        <span>{customerDetails.phone}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <MapPin size={16} className="text-gray-500 mt-0.5" />
                        <div>
                          <p>{customerDetails.address}</p>
                          <p className="text-gray-600">
                            {customerDetails.city}, {customerDetails.state} {customerDetails.zip_code}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">Loading customer details...</p>
                  )}
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="text-blue-600" size={20} />
                    <span>Booking Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span>
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-500" />
                    <span>{booking.time_slot}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Home size={16} className="text-gray-500" />
                    <span>{formatHouseSize(booking.house_size)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package size={16} className="text-gray-500" />
                    <span>{formatFrequency(booking.frequency)}</span>
                  </div>
                  
                  {booking.special_instructions && (
                    <div className="flex items-start space-x-2">
                      <FileText size={16} className="text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Special Instructions:</p>
                        <p className="text-gray-700">{booking.special_instructions}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cleaner Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="text-blue-600" size={20} />
                    <span>Cleaner Assignment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.cleaner_id ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {cleaners.find(c => c.id === booking.cleaner_id)?.first_name}{' '}
                          {cleaners.find(c => c.id === booking.cleaner_id)?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {cleaners.find(c => c.id === booking.cleaner_id)?.email}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle size={14} className="mr-1" />
                        Assigned
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-500">No cleaner assigned</p>
                      <Select onValueChange={assignCleaner}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cleaner" />
                        </SelectTrigger>
                        <SelectContent>
                          {cleaners.filter(c => c.is_active).map((cleaner) => (
                            <SelectItem key={cleaner.id} value={cleaner.id}>
                              {cleaner.first_name} {cleaner.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Services Selected */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="text-blue-600" size={20} />
                    <span>Services Selected</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Standard Services */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-800 mb-2">Standard Services:</h4>
                      {serviceDetails.length > 0 ? (
                        <div className="space-y-2">
                          {serviceDetails.map((service) => (
                            <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-gray-600">{service.description}</p>
                                {service.duration_hours && (
                                  <p className="text-xs text-gray-500">Duration: {service.duration_hours} hours</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">Qty: {service.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No standard services</p>
                      )}
                    </div>

                    {/* A La Carte Services */}
                    {aLaCarteDetails.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-800 mb-2">A La Carte Services:</h4>
                        <div className="space-y-2">
                          {aLaCarteDetails.map((service) => (
                            <div key={service.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-gray-600">{service.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${service.a_la_carte_price}</p>
                                <p className="text-sm text-gray-600">Qty: {service.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="text-blue-600" size={20} />
                    <span>Pricing Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">${booking.base_price?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {booking.a_la_carte_total > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">A La Carte Services:</span>
                        <span className="font-medium">${booking.a_la_carte_total?.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total Amount:</span>
                        <span className="font-bold text-xl text-blue-600">
                          ${booking.total_amount?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Payment Status: {booking.payment_status}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus('confirmed')}
                      disabled={booking.status === 'confirmed'}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus('in_progress')}
                      disabled={booking.status === 'in_progress'}
                    >
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateStatus('completed')}
                      disabled={booking.status === 'completed'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus('cancelled')}
                      disabled={booking.status === 'cancelled'}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;