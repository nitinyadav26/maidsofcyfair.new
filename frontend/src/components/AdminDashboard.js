import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Package, 
  Settings,
  FileText,
  UserCheck,
  MessageSquare,
  BarChart3,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  CalendarDays,
  Receipt
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import CalendarJobAssignment from './CalendarJobAssignment';
import InvoiceManagement from './InvoiceManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [faqs, setFAQs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCleaner, setNewCleaner] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    google_calendar_credentials: null,
    calendar_integration_enabled: false
  });
  
  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: '',
    is_active: true
  });

  const [newService, setNewService] = useState({
    name: '',
    category: 'standard_cleaning',
    description: '',
    is_a_la_carte: false,
    a_la_carte_price: null,
    duration_hours: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadBookings(),
        loadCleaners(),
        loadFAQs(),
        loadTickets(),
        loadServices()
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const loadCleaners = async () => {
    try {
      const response = await axios.get(`${API}/admin/cleaners`);
      setCleaners(response.data);
    } catch (error) {
      console.error('Failed to load cleaners:', error);
    }
  };

  const loadFAQs = async () => {
    try {
      const response = await axios.get(`${API}/admin/faqs`);
      setFAQs(response.data);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const response = await axios.get(`${API}/admin/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  // Booking management functions
  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.patch(`${API}/admin/bookings/${bookingId}`, { status });
      toast.success('Booking status updated');
      loadBookings();
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const assignCleaner = async (bookingId, cleanerId) => {
    try {
      await axios.patch(`${API}/admin/bookings/${bookingId}`, { cleaner_id: cleanerId });
      toast.success('Cleaner assigned successfully');
      loadBookings();
    } catch (error) {
      toast.error('Failed to assign cleaner');
    }
  };

  // Cleaner management functions
  const createCleaner = async () => {
    try {
      await axios.post(`${API}/admin/cleaners`, newCleaner);
      toast.success('Cleaner created successfully');
      setNewCleaner({ 
        email: '', 
        first_name: '', 
        last_name: '', 
        phone: '',
        google_calendar_credentials: null,
        calendar_integration_enabled: false
      });
      loadCleaners();
    } catch (error) {
      toast.error('Failed to create cleaner');
    }
  };

  const deleteCleaner = async (cleanerId) => {
    try {
      await axios.delete(`${API}/admin/cleaners/${cleanerId}`);
      toast.success('Cleaner deleted successfully');
      loadCleaners();
    } catch (error) {
      toast.error('Failed to delete cleaner');
    }
  };

  // FAQ management functions
  const createFAQ = async () => {
    try {
      await axios.post(`${API}/admin/faqs`, newFAQ);
      toast.success('FAQ created successfully');
      setNewFAQ({ question: '', answer: '', category: '', is_active: true });
      loadFAQs();
    } catch (error) {
      toast.error('Failed to create FAQ');
    }
  };

  const deleteFAQ = async (faqId) => {
    try {
      await axios.delete(`${API}/admin/faqs/${faqId}`);
      toast.success('FAQ deleted successfully');
      loadFAQs();
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  // Service management functions
  const createService = async () => {
    try {
      await axios.post(`${API}/admin/services`, newService);
      toast.success('Service created successfully');
      setNewService({
        name: '',
        category: 'standard_cleaning',
        description: '',
        is_a_la_carte: false,
        a_la_carte_price: null,
        duration_hours: null
      });
      loadServices();
    } catch (error) {
      toast.error('Failed to create service');
    }
  };

  const deleteService = async (serviceId) => {
    try {
      await axios.delete(`${API}/admin/services/${serviceId}`);
      toast.success('Service deleted successfully');
      loadServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  // Ticket management functions
  const updateTicketStatus = async (ticketId, status) => {
    try {
      await axios.patch(`${API}/admin/tickets/${ticketId}`, { status });
      toast.success('Ticket status updated');
      loadTickets();
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  // Export function
  const exportBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/export/bookings`);
      const csvData = response.data.data;
      
      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Bookings exported successfully');
    } catch (error) {
      toast.error('Failed to export bookings');
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

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${priorityColors[priority] || 'bg-gray-100 text-gray-800'} border-0`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Maids of Cyfair Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <CalendarDays size={16} />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center space-x-2">
              <Receipt size={16} />
              <span>Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="cleaners" className="flex items-center space-x-2">
              <UserCheck size={16} />
              <span>Cleaners</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <Package size={16} />
              <span>Services</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center space-x-2">
              <FileText size={16} />
              <span>FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>Tickets</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold">{stats.total_bookings || 0}</p>
                    </div>
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">${(stats.total_revenue || 0).toFixed(2)}</p>
                    </div>
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Cleaners</p>
                      <p className="text-2xl font-bold">{stats.total_cleaners || 0}</p>
                    </div>
                    <Users className="text-purple-600" size={24} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Open Tickets</p>
                      <p className="text-2xl font-bold">{stats.open_tickets || 0}</p>
                    </div>
                    <MessageSquare className="text-orange-600" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Booking #{booking.id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">{booking.booking_date} at {booking.time_slot}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-sm font-medium mt-1">${booking.total_amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Management */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Booking Management</h2>
              <Button onClick={exportBookings} className="btn-hover">
                <Download className="mr-2" size={16} />
                Export CSV
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4">Booking ID</th>
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Date & Time</th>
                        <th className="text-left p-4">Services</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Cleaner</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="p-4">#{booking.id.slice(-8)}</td>
                          <td className="p-4">{booking.customer_id.slice(-8)}</td>
                          <td className="p-4">
                            <div>
                              <p>{booking.booking_date}</p>
                              <p className="text-sm text-gray-600">{booking.time_slot}</p>
                            </div>
                          </td>
                          <td className="p-4">{booking.house_size} • {booking.frequency}</td>
                          <td className="p-4 font-medium">${booking.total_amount}</td>
                          <td className="p-4">{getStatusBadge(booking.status)}</td>
                          <td className="p-4">
                            <Select
                              value={booking.cleaner_id || ''}
                              onValueChange={(value) => assignCleaner(booking.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {cleaners.map((cleaner) => (
                                  <SelectItem key={cleaner.id} value={cleaner.id}>
                                    {cleaner.first_name} {cleaner.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                disabled={booking.status === 'confirmed'}
                              >
                                <CheckCircle size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                disabled={booking.status === 'completed'}
                              >
                                Complete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cleaners Management */}
          <TabsContent value="cleaners" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Cleaner Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="btn-hover">
                    <Plus className="mr-2" size={16} />
                    Add Cleaner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Cleaner</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        value={newCleaner.first_name}
                        onChange={(e) => setNewCleaner({...newCleaner, first_name: e.target.value})}
                      />
                      <Input
                        placeholder="Last Name"
                        value={newCleaner.last_name}
                        onChange={(e) => setNewCleaner({...newCleaner, last_name: e.target.value})}
                      />
                    </div>
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newCleaner.email}
                      onChange={(e) => setNewCleaner({...newCleaner, email: e.target.value})}
                    />
                    <Input
                      placeholder="Phone"
                      value={newCleaner.phone}
                      onChange={(e) => setNewCleaner({...newCleaner, phone: e.target.value})}
                    />
                    <Button onClick={createCleaner} className="w-full">
                      Create Cleaner
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cleaners.map((cleaner) => (
                <Card key={cleaner.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{cleaner.first_name} {cleaner.last_name}</h3>
                        <p className="text-sm text-gray-600">{cleaner.email}</p>
                        <p className="text-sm text-gray-600">{cleaner.phone}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCleaner(cleaner.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Jobs:</span>
                        <span className="font-medium">{cleaner.total_jobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Rating:</span>
                        <span className="font-medium">{cleaner.rating.toFixed(1)}/5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge className={cleaner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {cleaner.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Services Management */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Service Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="btn-hover">
                    <Plus className="mr-2" size={16} />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Service Name"
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                    />
                    <Select
                      value={newService.category}
                      onValueChange={(value) => setNewService({...newService, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard_cleaning">Standard Cleaning</SelectItem>
                        <SelectItem value="a_la_carte">A La Carte</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Description"
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                    />
                    {newService.category === 'a_la_carte' && (
                      <Input
                        placeholder="Price"
                        type="number"
                        value={newService.a_la_carte_price || ''}
                        onChange={(e) => setNewService({...newService, a_la_carte_price: parseFloat(e.target.value)})}
                      />
                    )}
                    {newService.category === 'standard_cleaning' && (
                      <Input
                        placeholder="Duration (hours)"
                        type="number"
                        value={newService.duration_hours || ''}
                        onChange={(e) => setNewService({...newService, duration_hours: parseInt(e.target.value)})}
                      />
                    )}
                    <Button onClick={createService} className="w-full">
                      Create Service
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <Badge className="mt-1">
                          {service.is_a_la_carte ? 'A La Carte' : 'Standard'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteService(service.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                    <div className="space-y-1 text-sm">
                      {service.is_a_la_carte && service.a_la_carte_price && (
                        <p><strong>Price:</strong> ${service.a_la_carte_price}</p>
                      )}
                      {service.duration_hours && (
                        <p><strong>Duration:</strong> {service.duration_hours} hours</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FAQs Management */}
          <TabsContent value="faqs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">FAQ Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="btn-hover">
                    <Plus className="mr-2" size={16} />
                    Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New FAQ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Question"
                      value={newFAQ.question}
                      onChange={(e) => setNewFAQ({...newFAQ, question: e.target.value})}
                    />
                    <Textarea
                      placeholder="Answer"
                      value={newFAQ.answer}
                      onChange={(e) => setNewFAQ({...newFAQ, answer: e.target.value})}
                      rows={4}
                    />
                    <Input
                      placeholder="Category"
                      value={newFAQ.category}
                      onChange={(e) => setNewFAQ({...newFAQ, category: e.target.value})}
                    />
                    <Button onClick={createFAQ} className="w-full">
                      Create FAQ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{faq.question}</h3>
                        <p className="text-gray-600 mb-2">{faq.answer}</p>
                        <Badge>{faq.category}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFAQ(faq.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Support Tickets */}
          <TabsContent value="tickets" className="space-y-6">
            <h2 className="text-2xl font-bold">Support Tickets</h2>

            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-gray-600 mb-2">{ticket.message}</p>
                        <p className="text-sm text-gray-500">
                          Customer: {ticket.customer_id.slice(-8)} • Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                          disabled={ticket.status === 'in_progress'}
                        >
                          <Clock size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'closed')}
                          disabled={ticket.status === 'closed'}
                        >
                          <CheckCircle size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;