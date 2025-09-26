import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, Home, Repeat, Check, ArrowRight, ArrowLeft, Plus, Minus, BedDouble, Tag, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import axios from 'axios';


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingFlow = ({ isGuest = false }) => {
  const navigate = useNavigate(); 
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Data states
  const [allServices, setAllServices] = useState([]);
  const [houseSize, setHouseSize] = useState('');
  const [frequency, setFrequency] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [aLaCarteCart, setALaCarteCart] = useState([]);
  const [rooms, setRooms] = useState({
    masterBedroom: false,
    masterBathroom: false,
    otherBedrooms: 0,
    otherFullBathrooms: 0,
    halfBathrooms: 0,
    diningRoom: false,
    kitchen: false,
    livingRoom: false,
    mediaRoom: false,
    gameRoom: false,
    office: false
  });
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
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Demo booking function
  const createDemoBooking = async () => {
    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const demoBookingData = {
        customer: {
          email: "demo@example.com",
          first_name: "Demo",
          last_name: "Customer",
          phone: "555-0123",
          address: "123 Demo Street",
          city: "Houston",
          state: "TX",
          zip_code: "77001",
          is_guest: true
        },
        house_size: "medium",
        frequency: "one_time",
        base_price: 150.0,
        rooms: {
          masterBedroom: true,
          masterBathroom: true,
          otherBedrooms: 2,
          otherFullBathrooms: 1,
          halfBathrooms: 1,
          diningRoom: true,
          kitchen: true,
          livingRoom: true,
          mediaRoom: false,
          gameRoom: false,
          office: false
        },
        services: [
          {
            service_id: "standard_cleaning",
            quantity: 1
          }
        ],
        a_la_carte_services: [
          {
            service_id: "deep_cleaning",
            quantity: 1
          }
        ],
        booking_date: tomorrowStr,
        time_slot: "9:00 AM - 11:00 AM",
        special_instructions: "Demo booking for testing purposes",
        promo_code: null
      };

      const response = await axios.post(`${API}/bookings/guest`, demoBookingData);
      
      // Skip payment processing for demo booking
      toast.success('Demo booking created successfully!');
      navigate(`/confirmation/${response.data.id}`);
    } catch (error) {
      toast.error('Demo booking failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const services = allServices.filter(s => !s.is_a_la_carte);
  const aLaCarteServices = allServices.filter(s => s.is_a_la_carte);

  // Load initial data
  useEffect(() => {
    loadAllServices();
    loadAvailableDates();
  }, []);

  // Update pricing when house size or frequency changes
  useEffect(() => {
    if (houseSize && frequency) {
      fetchPricing();
    }
  }, [houseSize, frequency]);

  const loadAllServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setAllServices(response.data);
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

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/pricing/${houseSize}/${frequency}`);
      setBasePrice(response.data.base_price);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      setBasePrice(125); // fallback to minimum price
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

  // House size options
  const houseSizeOptions = [
    { value: '1000-1500', label: '1000-1500 sq ft' },
    { value: '1500-2000', label: '1500-2000 sq ft' },
    { value: '2000-2500', label: '2000-2500 sq ft' },
    { value: '2500-3000', label: '2500-3000 sq ft' },
    { value: '3000-3500', label: '3000-3500 sq ft' },
    { value: '3500-4000', label: '3500-4000 sq ft' },
    { value: '4000-4500', label: '4000-4500 sq ft' },
    { value: '5000+', label: '5000+ sq ft' }
  ];

  // Frequency options
  const frequencyOptions = [
    { value: 'one_time', label: 'One Time  Clean / Move Out' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'every_3_weeks', label: 'Every 3 Weeks' },
    { value: 'bi_weekly', label: 'Bi-Weekly' },
    { value: 'weekly', label: 'Weekly' }
  ];

  // Service functions
  const addService = (service) => {
    if (!selectedServices.find(s => s.serviceId === service.id)) {
      setSelectedServices([...selectedServices, {
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1
      }]);
      toast.success(`${service.name} added`);
    }
  };

  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  // A la carte functions
  const addToALaCarte = (service) => {
    const existingItem = aLaCarteCart.find(item => item.serviceId === service.id);
    if (existingItem) {
      setALaCarteCart(aLaCarteCart.map(item => 
        item.serviceId === service.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setALaCarteCart([...aLaCarteCart, {
        serviceId: service.id,
        serviceName: service.name,
        price: service.a_la_carte_price,
        quantity: 1
      }]);
    }
    toast.success(`${service.name} added to cart`);
  };

  const updateALaCarteQuantity = (serviceId, quantity) => {
    if (quantity === 0) {
      setALaCarteCart(aLaCarteCart.filter(item => item.serviceId !== serviceId));
      return;
    }
    setALaCarteCart(aLaCarteCart.map(item => 
      item.serviceId === serviceId ? { ...item, quantity } : item
    ));
  };

  const getALaCarteTotal = () => {
    return aLaCarteCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalAmount = () => {
    const subtotal = basePrice + getALaCarteTotal();
    if (appliedPromo) {
      const discount = calculateDiscount(subtotal);
      return Math.max(0, subtotal - discount);
    }
    return subtotal;
  };

  const calculateDiscount = (subtotal) => {
    if (!appliedPromo) return 0;
    
    let discount = 0;
    if (appliedPromo.discount_type === 'percentage') {
      discount = (subtotal * appliedPromo.discount_value) / 100;
    } else {
      discount = appliedPromo.discount_value;
    }
    
    // Apply maximum discount limit if set
    if (appliedPromo.maximum_discount_amount && discount > appliedPromo.maximum_discount_amount) {
      discount = appliedPromo.maximum_discount_amount;
    }
    
    return Math.min(discount, subtotal);
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    try {
      const response = await axios.post(`${API}/validate-promo-code`, {
        code: promoCode.trim().toUpperCase(),
        subtotal: basePrice + getALaCarteTotal()
      });

      if (response.data.valid) {
        setAppliedPromo(response.data.promo);
        toast.success(`Promo code applied! You saved $${response.data.discount.toFixed(2)}`);
      } else {
        toast.error(response.data.message || 'Invalid promo code');
        setAppliedPromo(null);
      }
    } catch (error) {
      toast.error('Failed to validate promo code');
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    toast.success('Promo code removed');
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < 6) {
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
          is_guest: isGuestCheckout
        },
        house_size: houseSize,
        frequency: frequency,
        base_price: basePrice,
        rooms: rooms,
        services: selectedServices.map(item => ({
          service_id: item.serviceId,
          quantity: item.quantity
        })),
        a_la_carte_services: aLaCarteCart.map(item => ({
          service_id: item.serviceId,
          quantity: item.quantity
        })),
        booking_date: selectedDate,
        time_slot: selectedTimeSlot,
        special_instructions: specialInstructions,
        promo_code: appliedPromo?.code || null
      };

      const endpoint = isGuestCheckout ? `${API}/bookings/guest` : `${API}/bookings`;
      const response = await axios.post(endpoint, bookingData);
      
      // Skip payment processing for now - just confirm the booking
      toast.success('Booking confirmed successfully!');
      navigate(`/confirmation/${response.data.id}`);
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
      case 2: return houseSize && frequency;
      case 3: return true; // A la carte is optional
      case 4: return selectedDate !== '';
      case 5: return selectedTimeSlot !== '';
      case 6: return customerInfo.email && customerInfo.firstName && customerInfo.lastName;
      default: return true;
    }
  };

  // Step indicators
  const steps = [
    { number: 0, title: 'Service & Size', icon: Home },
    { number: 1, title: 'Rooms & Areas', icon: Home },
    { number: 2, title: 'A La Carte', icon: BedDouble },
    { number: 3, title: 'Choose Date', icon: Plus },
    { number: 4, title: 'Pick Time', icon: Calendar },
    { number: 5, title: 'Your Details', icon: Clock },
    { number: 6, title: 'Confirm & Pay', icon: MapPin },

  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        {/* Header */}
        <div className="professional-header mb-8 rounded-xl">
          <h1 className="text-4xl font-bold mb-4">
            Book Your Cleaning Service
          </h1>
          <p className="text-xl opacity-90">
            Professional cleaning services at your convenience
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="step-indicator flex space-x-6 p-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div
                  key={step.number}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'step-active'
                      : isCompleted
                      ? 'step-completed'
                      : 'step-inactive'
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
        <Card className="booking-card slide-up">
          <CardContent className="p-8">
            {/* Step 1: Service & House Size Selection */}
            {currentStep === 0 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Select Service Type & House Size
                  </CardTitle>
                  <p className="text-gray-600">Choose your cleaning service and home size for pricing</p>
                  
                  {/* Demo Booking Button */}
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Quick Demo</h4>
                    <p className="text-sm text-yellow-700 mb-3">Want to see how the booking system works? Create a demo booking!</p>
                    <Button 
                      onClick={createDemoBooking}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {loading ? 'Creating Demo...' : 'Create Demo Booking'}
                    </Button>
                  </div>
                </CardHeader>

                <div className="space-y-6">
                  {/* House Size Selection */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-4">
                      House Size (Square Footage)
                    </label>
                    <Select value={houseSize} onValueChange={setHouseSize}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your house size" />
                      </SelectTrigger>
                      <SelectContent>
                        {houseSizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Frequency Selection */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-4">
                      Service Frequency
                    </label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select service frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing Display */}
                  {basePrice > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Base Price:</span>
                        <span className="text-2xl font-bold text-primary">${basePrice.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Minimum charge is $125. Additional services available on next step.
                      </p>
                    </div>
                  )}

                  {/* Standard Services Selection */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-4">
                    
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((service) => {
                        const isSelected = selectedServices.find(s => s.serviceId === service.id);
                        return (
                          <Card 
                            key={service.id} 
                            className={`service-card cursor-pointer ${isSelected ? 'selected' : ''}`}
                            onClick={() => isSelected ? removeService(service.id) : addService(service)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-800">{service.name}</h4>
                                {isSelected && <Check className="text-primary" size={20} />}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                              {service.duration_hours && (
                                <span className="text-sm text-gray-500">Duration: {service.duration_hours} hours</span>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Rooms & Areas */}
            {currentStep === 1 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Select Rooms & Areas
                  </CardTitle>
                  <p className="text-gray-600">Choose the rooms and areas you’d like us to clean. If an area isn’t selected, it will not be cleaned.</p>
                </CardHeader>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">Bedrooms & Bathrooms</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.masterBedroom}
                          onChange={(e) => setRooms({ ...rooms, masterBedroom: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Master Bedroom</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.masterBathroom}
                          onChange={(e) => setRooms({ ...rooms, masterBathroom: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Master Bathroom</span>
                      </label>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="mb-2 text-gray-800">How many other bedrooms?</div>
                        <Select
                          value={String(rooms.otherBedrooms)}
                          onValueChange={(v) => setRooms({ ...rooms, otherBedrooms: Number(v) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="mb-2 text-gray-800">How many other full bathrooms?</div>
                        <Select
                          value={String(rooms.otherFullBathrooms)}
                          onValueChange={(v) => setRooms({ ...rooms, otherFullBathrooms: Number(v) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="mb-2 text-gray-800">How many half bathrooms?</div>
                        <Select
                          value={String(rooms.halfBathrooms)}
                          onValueChange={(v) => setRooms({ ...rooms, halfBathrooms: Number(v) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800">Common Areas</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.diningRoom}
                          onChange={(e) => setRooms({ ...rooms, diningRoom: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Dining Room</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.kitchen}
                          onChange={(e) => setRooms({ ...rooms, kitchen: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Kitchen</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.livingRoom}
                          onChange={(e) => setRooms({ ...rooms, livingRoom: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Living Room</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.mediaRoom}
                          onChange={(e) => setRooms({ ...rooms, mediaRoom: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Media Room</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.gameRoom}
                          onChange={(e) => setRooms({ ...rooms, gameRoom: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Game Room</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.office}
                          onChange={(e) => setRooms({ ...rooms, office: e.target.checked })}
                        />
                        <span className="text-gray-800">Clean Office</span>
                      </label>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Base Service:</span><span>${basePrice.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Add-ons:</span><span>${getALaCarteTotal().toFixed(2)}</span></div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Step 2: A La Carte Services */}
            {currentStep === 2 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    A La Carte Add-ons
                  </CardTitle>
                  <p className="text-gray-600">Optional add-ons to customize your clean.</p>
                </CardHeader>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* A La Carte Services */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Add-Ons</h3>
                    <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {aLaCarteServices.map((service) => (
                        <Card key={service.id} className="service-card">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-800 text-sm">{service.name}</h4>
                              <Badge variant="secondary">${service.a_la_carte_price}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{service.description}</p>
                            <Button 
                              onClick={() => addToALaCarte(service)}
                              className="w-full btn-hover bg-primary hover:bg-primary-light"
                              size="sm"
                            >
                              Add to Cart
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* A La Carte Cart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      A La Carte Cart ({aLaCarteCart.length} items)
                    </h3>
                    
                    {aLaCarteCart.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No add-on services selected</p>
                    ) : (
                      <>
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                          {aLaCarteCart.map((item) => (
                            <div key={item.serviceId} className="flex justify-between items-center bg-white p-3 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">{item.serviceName}</h4>
                                <p className="text-xs text-gray-600">${item.price} each</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateALaCarteQuantity(item.serviceId, item.quantity - 1)}
                                >
                                  <Minus size={14} />
                                </Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateALaCarteQuantity(item.serviceId, item.quantity + 1)}
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center font-semibold">
                            <span>Add-on Total:</span>
                            <span className="text-primary">${getALaCarteTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Total Summary */}
                    <div className="mt-6 p-4 bg-white rounded-lg border-2 border-primary">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Service:</span>
                          <span>${basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Add-ons:</span>
                          <span>${getALaCarteTotal().toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            {/* Step 3: Choose Date */}
            {currentStep === 3 && (
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
                        className={`service-card cursor-pointer ${isSelected ? 'selected' : ''}`}
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

            {/* Step 4: Pick Time */}
            {currentStep === 4 && (
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
                        className={`service-card cursor-pointer ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedTimeSlot(timeSlotString)}
                      >
                        <CardContent className="p-4 text-center">
                          <Clock className="mx-auto mb-2 text-primary" size={24} />
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

            {/* Step 5: Customer Details */}
            {currentStep === 5 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Your Contact Information
                  </CardTitle>
                  <p className="text-gray-600">We need this to confirm your booking</p>
                </CardHeader>

                {/* Guest Checkout Option */}
                <div className="mb-6">
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="guestCheckout"
                            checked={isGuestCheckout}
                            onChange={(e) => setIsGuestCheckout(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="guestCheckout" className="text-sm font-medium text-gray-700">
                            Continue as Guest (No account required)
                          </label>
                        </div>
                        <Badge variant={isGuestCheckout ? "default" : "secondary"}>
                          {isGuestCheckout ? "Guest Checkout" : "Account Required"}
                        </Badge>
                      </div>
                      {isGuestCheckout && (
                        <p className="text-xs text-gray-500 mt-2">
                          You can create an account later to manage your bookings
                        </p>
                      )}
                      {!isGuestCheckout && (
                        <p className="text-xs text-gray-500 mt-2">
                          <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
                            Login to your account
                          </a> to manage your bookings and view history
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

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
                        placeholder="Anything else we should know? (Special instructions, pets, gate codes, etc.)"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {currentStep === 6 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Confirm Your Booking
                  </CardTitle>
                  <p className="text-gray-600">Review your details and confirm your booking</p>
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
                          <span className="text-gray-600">House Size:</span>
                          <span className="font-medium">{houseSize} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium">
                            {frequencyOptions.find(f => f.value === frequency)?.label}
                          </span>
                        </div>
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
                        <div className="border-t pt-3">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Base Service:</span>
                              <span>${basePrice.toFixed(2)}</span>
                            </div>
                            {aLaCarteCart.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Add-on Services:</span>
                                <span>${getALaCarteTotal().toFixed(2)}</span>
                              </div>
                            )}
                            {appliedPromo && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount ({appliedPromo.code}):</span>
                                <span>-${calculateDiscount(basePrice + getALaCarteTotal()).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                              <span>Total Amount:</span>
                              <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                            </div>
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

                  {/* Promo Code Section */}
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Tag className="mr-2" size={20} />
                        Promo Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!appliedPromo ? (
                        <div className="space-y-4">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Enter promo code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              className="flex-1"
                            />
                            <Button
                              onClick={validatePromoCode}
                              disabled={promoLoading || !promoCode.trim()}
                              variant="outline"
                            >
                              {promoLoading ? 'Validating...' : 'Apply'}
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">
                            Enter a valid promo code to get a discount on your booking.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <Check className="mr-2 text-green-600" size={20} />
                              <div>
                                <div className="font-semibold text-green-800">
                                  {appliedPromo.code} Applied!
                                </div>
                                <div className="text-sm text-green-600">
                                  {appliedPromo.discount_type === 'percentage' 
                                    ? `${appliedPromo.discount_value}% off`
                                    : `$${appliedPromo.discount_value} off`
                                  }
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removePromoCode}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="mr-1" size={14} />
                              Remove
                            </Button>
                          </div>
                          {appliedPromo.description && (
                            <p className="text-sm text-gray-600">{appliedPromo.description}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Booking Confirmation */}
                  <Card className="border border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800">Ready to Confirm</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700 mb-4">
                        Your booking is ready to be confirmed. Click "Complete Booking" to finalize your appointment.
                      </p>
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm">
                          <strong>Note:</strong> Payment will be handled separately. Your booking will be confirmed immediately.
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
                disabled={currentStep === 0}
                className="btn-hover"
              >
                <ArrowLeft className="mr-2" size={16} />
                Previous
              </Button>

              {currentStep < 6 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="btn-hover bg-primary hover:bg-primary-light"
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
                      Confirming...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <Check className="ml-2" size={16} />
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