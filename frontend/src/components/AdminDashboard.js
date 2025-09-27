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
  Receipt,
  LogOut,
  TrendingUp,
  Calendar as CalendarIcon,
  X,
  RotateCcw
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
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import InvoiceManagement from './InvoiceManagement';
import PromoCodeManagement from './PromoCodeManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
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

  // Reports and Orders state
  const [weeklyStats, setWeeklyStats] = useState({
    totalBookings: 0,
    revenue: 0,
    cancellations: 0,
    reschedules: 0,
    completionRate: 0,
    customerSatisfaction: 0,
    avgBookingValue: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    totalBookings: 0,
    revenue: 0,
    cancellations: 0,
    reschedules: 0,
    completionRate: 0,
    customerSatisfaction: 0,
    avgBookingValue: 0
  });
  const [pendingCancellations, setPendingCancellations] = useState([]);
  const [pendingReschedules, setPendingReschedules] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

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
      // Prepare service data with proper is_a_la_carte flag
      const serviceData = {
        ...newService,
        is_a_la_carte: newService.category === 'a_la_carte'
      };
      
      await axios.post(`${API}/admin/services`, serviceData);
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

  // Reports and Orders functions
  const loadReports = async () => {
    try {
      const [weeklyResponse, monthlyResponse] = await Promise.all([
        axios.get(`${API}/admin/reports/weekly`),
        axios.get(`${API}/admin/reports/monthly`)
      ]);
      
      setWeeklyStats(weeklyResponse.data);
      setMonthlyStats(monthlyResponse.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    }
  };

  const loadPendingOrders = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders/pending`);
      setPendingCancellations(response.data.cancellations || []);
      setPendingReschedules(response.data.reschedules || []);
    } catch (error) {
      console.error('Failed to load pending orders:', error);
      toast.error('Failed to load pending orders');
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders/history`);
      setOrderHistory(response.data || []);
    } catch (error) {
      console.error('Failed to load order history:', error);
      toast.error('Failed to load order history');
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      await axios.post(`${API}/admin/orders/${orderId}/${action}`);
      toast.success(`Order ${action.replace('_', ' ')} successful`);
      loadPendingOrders();
      loadOrderHistory();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      toast.error(`Failed to ${action.replace('_', ' ')} order`);
    }
  };

  const exportReport = async (type) => {
    try {
      const response = await axios.get(`${API}/admin/reports/${type}/export`);
      const csvData = response.data.data;
      
      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported`);
    } catch (error) {
      console.error(`Failed to export ${type} report:`, error);
      toast.error(`Failed to export ${type} report`);
    }
  };

  // Load reports and orders when switching to those tabs
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    } else if (activeTab === 'orders') {
      loadPendingOrders();
      loadOrderHistory();
    }
  }, [activeTab]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        const tabOrder = [
          'dashboard', 'bookings', 'calendar', 'invoices', 'cleaners', 
          'services', 'promos', 'reports', 'orders', 'faqs', 'tickets'
        ];
        const currentIndex = tabOrder.indexOf(activeTab);
        
        if (event.key === 'ArrowLeft' && currentIndex > 0) {
          event.preventDefault();
          setActiveTab(tabOrder[currentIndex - 1]);
        } else if (event.key === 'ArrowRight' && currentIndex < tabOrder.length - 1) {
          event.preventDefault();
          setActiveTab(tabOrder[currentIndex + 1]);
        } else if (event.key >= '1' && event.key <= '9') {
          event.preventDefault();
          const tabIndex = parseInt(event.key) - 1;
          if (tabIndex < tabOrder.length) {
            setActiveTab(tabOrder[tabIndex]);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

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
            <div>
              <Button
                variant="outline"
                className="btn-hover"
                onClick={() => { logout(); navigate('/admin/login'); }}
              >
                <LogOut className="mr-2" size={16} /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <style jsx>{`
            .tab-content {
              animation: fadeIn 0.3s ease-in-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {/* Enhanced Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
              <div className="text-xs text-gray-500 hidden lg:block">
                Use Ctrl+1-9 to navigate tabs • Ctrl+←/→ for previous/next
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 p-2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl border border-gray-200 shadow-inner">
              <TabsTrigger 
                value="dashboard" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label="Dashboard overview and statistics"
                title="Dashboard (Ctrl+1)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <BarChart3 size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Dashboard</span>
                <span className="sm:hidden relative z-10" title="Dashboard">📊</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label={`Bookings management (${bookings.length} bookings)`}
                title="Bookings (Ctrl+2)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Calendar size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Bookings</span>
                <span className="sm:hidden relative z-10" title="Bookings">📅</span>
                {bookings.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {bookings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label="Calendar job assignment and scheduling"
                title="Calendar (Ctrl+3)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CalendarDays size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Calendar</span>
                <span className="sm:hidden relative z-10" title="Calendar">🗓️</span>
              </TabsTrigger>
              <TabsTrigger 
                value="invoices" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label="Invoice management and generation"
                title="Invoices (Ctrl+4)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Receipt size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Invoices</span>
                <span className="sm:hidden relative z-10" title="Invoices">🧾</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cleaners" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label={`Cleaner management (${cleaners.length} cleaners)`}
                title="Cleaners (Ctrl+5)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <UserCheck size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Cleaners</span>
                <span className="sm:hidden relative z-10" title="Cleaners">👥</span>
                {cleaners.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {cleaners.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label={`Service management (${services.length} services)`}
                title="Services (Ctrl+6)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Package size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Services</span>
                <span className="sm:hidden relative z-10" title="Services">📦</span>
                {services.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {services.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="promos" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label="Promo code management"
                title="Promo Codes (Ctrl+7)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <DollarSign size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Promo Codes</span>
                <span className="sm:hidden relative z-10" title="Promo Codes">💰</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label="Reports and analytics"
                title="Reports (Ctrl+8)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <TrendingUp size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Reports</span>
                <span className="sm:hidden relative z-10" title="Reports">📈</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label={`Order management (${pendingCancellations.length + pendingReschedules.length} pending)`}
                title="Orders (Ctrl+9)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CalendarIcon size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Orders</span>
                <span className="sm:hidden relative z-10" title="Orders">📋</span>
                {(pendingCancellations.length > 0 || pendingReschedules.length > 0) && (
                  <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {pendingCancellations.length + pendingReschedules.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="faqs" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label={`FAQ management (${faqs.length} FAQs)`}
                title="FAQs (Ctrl+0)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FileText size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">FAQs</span>
                <span className="sm:hidden relative z-10" title="FAQs">❓</span>
                {faqs.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {faqs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="tickets" 
                className="group flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white hover:shadow-lg hover:text-blue-700 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 data-[state=active]:border-blue-300 data-[state=active]:scale-105 rounded-lg border border-transparent relative overflow-hidden"
                aria-label={`Support tickets (${tickets.length} tickets)`}
                title="Tickets (Ctrl+Shift+1)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <MessageSquare size={18} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Tickets</span>
                <span className="sm:hidden relative z-10" title="Tickets">🎫</span>
                {tickets.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {tickets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6 tab-content">
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

          {/* Calendar Job Assignment */}
          <TabsContent value="calendar" className="space-y-6 tab-content">
            <CalendarJobAssignment />
          </TabsContent>

          {/* Invoice Management */}
          <TabsContent value="invoices" className="space-y-6 tab-content">
            <InvoiceManagement />
          </TabsContent>

          {/* Promo Code Management */}
          <TabsContent value="promos" className="space-y-6 tab-content">
            <PromoCodeManagement />
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6 tab-content">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <div className="flex space-x-2">
                <Button onClick={() => exportReport('weekly')} variant="outline">
                  <Download className="mr-2" size={16} />
                  Weekly Report
                </Button>
                <Button onClick={() => exportReport('monthly')} variant="outline">
                  <Download className="mr-2" size={16} />
                  Monthly Report
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2" size={20} />
                    Weekly Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Bookings:</span>
                      <span className="font-semibold">{weeklyStats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="font-semibold text-green-600">${weeklyStats.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cancellations:</span>
                      <span className="font-semibold text-red-600">{weeklyStats.cancellations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reschedules:</span>
                      <span className="font-semibold text-yellow-600">{weeklyStats.reschedules}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2" size={20} />
                    Monthly Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Bookings:</span>
                      <span className="font-semibold">{monthlyStats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="font-semibold text-green-600">${monthlyStats.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cancellations:</span>
                      <span className="font-semibold text-red-600">{monthlyStats.cancellations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reschedules:</span>
                      <span className="font-semibold text-yellow-600">{monthlyStats.reschedules}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{weeklyStats.completionRate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{weeklyStats.customerSatisfaction}%</div>
                    <div className="text-sm text-gray-600">Customer Satisfaction</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{weeklyStats.avgBookingValue}</div>
                    <div className="text-sm text-gray-600">Avg Booking Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Management */}
          <TabsContent value="orders" className="space-y-6 tab-content">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Order Management</h2>
              <div className="flex space-x-2">
                <Button onClick={loadPendingOrders} variant="outline">
                  <RotateCcw className="mr-2" size={16} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Cancellations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <X className="mr-2 text-red-600" size={20} />
                    Pending Cancellations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingCancellations.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">#{order.id.slice(-8)}</div>
                          <div className="text-sm text-gray-600">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.booking_date}</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOrderAction(order.id, 'approve_cancellation')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleOrderAction(order.id, 'deny_cancellation')}
                          >
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingCancellations.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No pending cancellations</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Reschedules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <RotateCcw className="mr-2 text-yellow-600" size={20} />
                    Pending Reschedules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingReschedules.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">#{order.id.slice(-8)}</div>
                          <div className="text-sm text-gray-600">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">
                            {order.original_date} → {order.new_date}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOrderAction(order.id, 'approve_reschedule')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleOrderAction(order.id, 'deny_reschedule')}
                          >
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingReschedules.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No pending reschedules</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Order Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          order.type === 'cancellation' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">#{order.id.slice(-8)}</div>
                          <div className="text-sm text-gray-600">{order.customer_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {order.type === 'cancellation' ? 'Cancelled' : 'Rescheduled'}
                        </div>
                        <div className="text-xs text-gray-500">{order.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Management */}
          <TabsContent value="bookings" className="space-y-6 tab-content">
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
                              value={booking.cleaner_id || undefined}
                              onValueChange={(value) => assignCleaner(booking.id, value === 'none' ? null : value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
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
          <TabsContent value="cleaners" className="space-y-6 tab-content">
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
          <TabsContent value="services" className="space-y-6 tab-content">
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
                      onValueChange={(value) => setNewService({
                        ...newService, 
                        category: value,
                        is_a_la_carte: value === 'a_la_carte'
                      })}
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
          <TabsContent value="faqs" className="space-y-6 tab-content">
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
          <TabsContent value="tickets" className="space-y-6 tab-content">
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