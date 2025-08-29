import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, ShoppingCart, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Data states
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Load initial data
  useEffect(() => {
    loadServices();
    loadAvailableDates();
  }, []);

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const response = await axios.get(`${API}/available-dates`);
      setAvailableDates(response.data);
    } catch (error) {
      toast.error('Failed to load available dates');
      console.error(error);
    }
  };

  const loadTimeSlots = async (date) => {
    try {
      const response = await axios.get(`${API}/time-slots?date=${date}`);
      setTimeSlots(response.data);
    } catch (error) {
      toast.error('Failed to load time slots');
      console.error(error);
    }
  };

  // Cart functions
  const addToCart = (service) => {
    const existingItem = cart.find(item => item.serviceId === service.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.serviceId === service.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        serviceId: service.id,
        serviceName: service.name,
        price: service.base_price,
        quantity: 1
      }]);
    }
    toast.success(`${service.name} added to cart`);
  };

  const removeFromCart = (serviceId) => {
    setCart(cart.filter(item => item.serviceId !== serviceId));
  };

  const updateCartQuantity = (serviceId, quantity) => {
    if (quantity === 0) {
      removeFromCart(serviceId);
      return;
    }
    setCart(cart.map(item => 
      item.serviceId === serviceId ? { ...item, quantity } : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Date selection handler
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    loadTimeSlots(date);
  };

  // Submit booking
  const submitBooking = async () => {
    setLoading(true);
    try {
      const bookingData = {
        customer: {
          email: customerInfo.email,
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zip_code: customerInfo.zipCode,
          is_guest: true
        },
        services: cart.map(item => ({
          service_id: item.serviceId,
          quantity: item.quantity
        })),
        booking_date: selectedDate,
        time_slot: selectedTimeSlot,
        special_instructions: specialInstructions
      };

      const response = await axios.post(`${API}/bookings`, bookingData);
      
      // Process mock payment
      const paymentResponse = await axios.post(`${API}/process-payment/${response.data.id}`, {
        amount: getTotalAmount(),
        payment_method: 'mock_card'
      });

      if (paymentResponse.data.success) {
        navigate(`/confirmation/${response.data.id}`);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      toast.error('Booking failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Step validation
  const canProceedToStep = (step) => {
    switch (step) {
      case 2: return cart.length > 0;
      case 3: return selectedDate !== '';
      case 4: return selectedTimeSlot !== '';
      case 5: return customerInfo.email && customerInfo.firstName && customerInfo.lastName;
      default: return true;
    }
  };

  // Step indicators
  const steps = [
    { number: 1, title: 'Select Services', icon: ShoppingCart },
    { number: 2, title: 'Choose Date', icon: Calendar },
    { number: 3, title: 'Pick Time', icon: Clock },
    { number: 4, title: 'Your Details', icon: MapPin },
    { number: 5, title: 'Confirm & Pay', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold text-white mb-4">
            Book Your Cleaning Service
          </h1>
          <p className="text-xl text-white/80">
            Professional cleaning services at your convenience
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4 bg-white/10 backdrop-blur-lg rounded-full p-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div
                  key={step.number}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-purple-600'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'text-white/60'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium hidden md:block">{step.title}</span>
                  {isCompleted && <Check size={16} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card className="glass-effect card-shadow rounded-2xl border-0 slide-up">
          <CardContent className="p-8">
            {/* Step 1: Select Services */}
            {currentStep === 1 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Choose Your Cleaning Services
                  </CardTitle>
                  <p className="text-gray-600">Select the services you need</p>
                </CardHeader>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Services</h3>
                    {services.map((service) => (
                      <Card key={service.id} className="border border-gray-200 hover:border-purple-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{service.name}</h4>
                            <Badge variant="secondary">${service.base_price}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{service.duration_hours} hours</span>
                            <Button 
                              onClick={() => addToCart(service)}
                              className="btn-hover bg-purple-600 hover:bg-purple-700"
                              size="sm"
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Shopping Cart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Your Cart ({cart.length} items)
                    </h3>
                    
                    {cart.length === 0 ? (
                      <p className="text-gray-500">No services selected</p>
                    ) : (
                      <>
                        <div className="space-y-3 mb-4">
                          {cart.map((item) => (
                            <div key={item.serviceId} className="flex justify-between items-center bg-white p-3 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-800">{item.serviceName}</h4>
                                <p className="text-sm text-gray-600">${item.price} each</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateCartQuantity(item.serviceId, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateCartQuantity(item.serviceId, item.quantity + 1)}
                                >
                                  +
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => removeFromCart(item.serviceId)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center font-semibold text-lg">
                            <span>Total: </span>
                            <span className="text-purple-600">${getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Choose Date */}
            {currentStep === 2 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Select Your Preferred Date
                  </CardTitle>
                  <p className="text-gray-600">Choose from available dates</p>
                </CardHeader>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {availableDates.map((date) => {
                    const dateObj = new Date(date);
                    const isSelected = selectedDate === date;
                    
                    return (
                      <Card 
                        key={date}
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'ring-2 ring-purple-500 bg-purple-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleDateSelect(date)}
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
            )}

            {/* Step 3: Pick Time */}
            {currentStep === 3 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Choose Your Time Slot
                  </CardTitle>
                  <p className="text-gray-600">
                    Available times for {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </CardHeader>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {timeSlots.map((slot) => {
                    const timeSlotString = `${slot.start_time}-${slot.end_time}`;
                    const isSelected = selectedTimeSlot === timeSlotString;
                    
                    return (
                      <Card 
                        key={`${slot.start_time}-${slot.end_time}`}
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'ring-2 ring-purple-500 bg-purple-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTimeSlot(timeSlotString)}
                      >
                        <CardContent className="p-4 text-center">
                          <Clock className="mx-auto mb-2 text-purple-600" size={24} />
                          <div className="font-semibold text-gray-800">
                            {slot.start_time} - {slot.end_time}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Customer Details */}
            {currentStep === 4 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Your Contact Information
                  </CardTitle>
                  <p className="text-gray-600">We need this to confirm your booking</p>
                </CardHeader>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <Input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <Input
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        placeholder="John"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <Input
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        placeholder="Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <Input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <Input
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="123 Main Street"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <Input
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        placeholder="Houston"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <Input
                          value={customerInfo.state}
                          onChange={(e) => setCustomerInfo({...customerInfo, state: e.target.value})}
                          placeholder="TX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                        <Input
                          value={customerInfo.zipCode}
                          onChange={(e) => setCustomerInfo({...customerInfo, zipCode: e.target.value})}
                          placeholder="77429"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                      <Textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special requests or instructions..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Confirm Your Booking
                  </CardTitle>
                  <p className="text-gray-600">Review your details before payment</p>
                </CardHeader>

                <div className="space-y-6">
                  {/* Booking Summary */}
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">
                            {new Date(selectedDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">{selectedTimeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Services:</span>
                          <div className="text-right">
                            {cart.map((item) => (
                              <div key={item.serviceId}>
                                {item.serviceName} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total Amount:</span>
                            <span className="text-purple-600">${getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Info */}
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Name:</strong> {customerInfo.firstName} {customerInfo.lastName}</p>
                          <p><strong>Email:</strong> {customerInfo.email}</p>
                          <p><strong>Phone:</strong> {customerInfo.phone}</p>
                        </div>
                        <div>
                          <p><strong>Address:</strong> {customerInfo.address}</p>
                          <p><strong>City:</strong> {customerInfo.city}, {customerInfo.state} {customerInfo.zipCode}</p>
                        </div>
                      </div>
                      {specialInstructions && (
                        <div className="mt-4">
                          <p><strong>Special Instructions:</strong></p>
                          <p className="text-gray-600">{specialInstructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Mock Payment */}
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        This is a demo payment system. Click "Complete Booking" to simulate payment processing.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          <strong>Demo Mode:</strong> No actual payment will be processed. 
                          This booking will be created for demonstration purposes.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="btn-hover"
              >
                <ArrowLeft className="mr-2" size={16} />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="btn-hover bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              ) : (
                <Button
                  onClick={submitBooking}
                  disabled={loading}
                  className="btn-hover bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Booking
                      <CreditCard className="ml-2" size={16} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingFlow;