import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, BedDouble, Bath, Utensils, Tv, Gamepad2, Briefcase, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditCleaningSelection = () => {
  const navigate = useNavigate();
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [houseSize, setHouseSize] = useState('');
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
  const [selectedServices, setSelectedServices] = useState([]);
  const [aLaCarteCart, setALaCarteCart] = useState([]);
  const [basePrice, setBasePrice] = useState(0);

  const services = allServices.filter(s => !s.is_a_la_carte);
  const aLaCarteServices = allServices.filter(s => s.is_a_la_carte);

  useEffect(() => {
    loadCurrentAppointment();
    loadAllServices();
  }, []);

  useEffect(() => {
    if (houseSize && currentAppointment?.frequency) {
      fetchPricing();
    }
  }, [houseSize, currentAppointment?.frequency]);

  const loadCurrentAppointment = async () => {
    try {
      const response = await axios.get(`${API}/customer/next-appointment`);
      const appointment = response.data;
      setCurrentAppointment(appointment);
      
      // Pre-populate form with current appointment data
      if (appointment) {
        setHouseSize(appointment.house_size || '');
        setRooms(appointment.rooms || {
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
        setBasePrice(appointment.base_price || 0);
      }
    } catch (error) {
      console.error('Failed to load current appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setAllServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/pricing/${houseSize}/${currentAppointment?.frequency}`);
      setBasePrice(response.data.base_price);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      setBasePrice(125); // fallback to minimum price
    }
  };

  const addService = (service) => {
    if (!selectedServices.find(s => s.serviceId === service.id)) {
      setSelectedServices([...selectedServices, {
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1
      }]);
    }
  };

  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

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
    return basePrice + getALaCarteTotal();
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await axios.put(`${API}/customer/update-cleaning-selection`, {
        appointment_id: currentAppointment.id,
        house_size: houseSize,
        rooms: rooms,
        services: selectedServices.map(item => ({
          service_id: item.serviceId,
          quantity: item.quantity
        })),
        a_la_carte_services: aLaCarteCart.map(item => ({
          service_id: item.serviceId,
          quantity: item.quantity
        }))
      });

      navigate('/');
    } catch (error) {
      console.error('Failed to update cleaning selection:', error);
    } finally {
      setSubmitting(false);
    }
  };

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
              <Home className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointment to Edit</h3>
              <p className="text-gray-500 mb-4">You don't have any upcoming appointments to edit.</p>
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
          <h1 className="text-4xl font-bold text-gray-800">Edit Cleaning Selection</h1>
          <p className="text-xl text-gray-600 mt-2">Modify your cleaning service details</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* House Size */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">House Size</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Rooms Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Rooms & Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Bedrooms & Bathrooms */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <BedDouble className="mr-2" size={20} />
                      Bedrooms & Bathrooms
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.masterBedroom}
                          onChange={(e) => setRooms({ ...rooms, masterBedroom: e.target.checked })}
                        />
                        <span className="text-gray-800">Master Bedroom</span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.masterBathroom}
                          onChange={(e) => setRooms({ ...rooms, masterBathroom: e.target.checked })}
                        />
                        <span className="text-gray-800">Master Bathroom</span>
                      </label>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="mb-2 text-gray-800">Other Bedrooms</div>
                        <Select
                          value={String(rooms.otherBedrooms)}
                          onValueChange={(v) => setRooms({ ...rooms, otherBedrooms: Number(v) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="mb-2 text-gray-800">Other Full Bathrooms</div>
                        <Select
                          value={String(rooms.otherFullBathrooms)}
                          onValueChange={(v) => setRooms({ ...rooms, otherFullBathrooms: Number(v) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="mb-2 text-gray-800">Half Bathrooms</div>
                        <Select
                          value={String(rooms.halfBathrooms)}
                          onValueChange={(v) => setRooms({ ...rooms, halfBathrooms: Number(v) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Common Areas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Home className="mr-2" size={20} />
                      Common Areas
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.diningRoom}
                          onChange={(e) => setRooms({ ...rooms, diningRoom: e.target.checked })}
                        />
                        <span className="text-gray-800 flex items-center">
                          <Utensils className="mr-2" size={16} />
                          Dining Room
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.kitchen}
                          onChange={(e) => setRooms({ ...rooms, kitchen: e.target.checked })}
                        />
                        <span className="text-gray-800 flex items-center">
                          <Utensils className="mr-2" size={16} />
                          Kitchen
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.livingRoom}
                          onChange={(e) => setRooms({ ...rooms, livingRoom: e.target.checked })}
                        />
                        <span className="text-gray-800 flex items-center">
                          <Home className="mr-2" size={16} />
                          Living Room
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.mediaRoom}
                          onChange={(e) => setRooms({ ...rooms, mediaRoom: e.target.checked })}
                        />
                        <span className="text-gray-800 flex items-center">
                          <Tv className="mr-2" size={16} />
                          Media Room
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.gameRoom}
                          onChange={(e) => setRooms({ ...rooms, gameRoom: e.target.checked })}
                        />
                        <span className="text-gray-800 flex items-center">
                          <Gamepad2 className="mr-2" size={16} />
                          Game Room
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={rooms.office}
                          onChange={(e) => setRooms({ ...rooms, office: e.target.checked })}
                        />
                        <span className="text-gray-800 flex items-center">
                          <Briefcase className="mr-2" size={16} />
                          Office
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Standard Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Standard Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((service) => {
                    const isSelected = selectedServices.find(s => s.serviceId === service.id);
                    return (
                      <Card 
                        key={service.id} 
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => isSelected ? removeService(service.id) : addService(service)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{service.name}</h4>
                            {isSelected && <Badge variant="secondary">Selected</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Add-ons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Add-Ons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {aLaCarteServices.map((service) => (
                    <Card key={service.id} className="service-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800">{service.name}</h4>
                          <Badge variant="secondary">${service.a_la_carte_price}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <Button 
                          onClick={() => addToALaCarte(service)}
                          className="w-full"
                          size="sm"
                        >
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Calculator */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <DollarSign className="mr-2" size={20} />
                  Price Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Service:</span>
                      <span>${basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Add-ons:</span>
                      <span>${getALaCarteTotal().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* A La Carte Cart */}
                  {aLaCarteCart.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Selected Add-ons</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {aLaCarteCart.map((item) => (
                          <div key={item.serviceId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.serviceName}</div>
                              <div className="text-xs text-gray-600">${item.price} each</div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateALaCarteQuantity(item.serviceId, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateALaCarteQuantity(item.serviceId, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary-light"
                  >
                    {submitting ? 'Saving Changes...' : 'Save Changes'}
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

export default EditCleaningSelection;
