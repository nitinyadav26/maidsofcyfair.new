import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  Send, 
  Trash2,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  useEffect(() => {
    loadInvoices();
    loadCompletedBookings();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/invoices${statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to load invoices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings`);
      const completed = response.data.filter(booking => 
        booking.status === 'completed' && 
        !invoices.some(invoice => invoice.booking_id === booking.id)
      );
      setCompletedBookings(completed);
    } catch (error) {
      console.error('Failed to load completed bookings:', error);
    }
  };

  const generateInvoice = async (bookingId) => {
    try {
      await axios.post(`${API}/admin/invoices/generate/${bookingId}`);
      toast.success('Invoice generated successfully');
      loadInvoices();
      loadCompletedBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate invoice');
    }
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    try {
      await axios.patch(`${API}/admin/invoices/${invoiceId}`, { status });
      toast.success('Invoice status updated');
      loadInvoices();
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const downloadInvoicePDF = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/invoices/${invoiceId}/pdf`);
      
      if (response.data.pdf_content) {
        // Convert base64 to blob
        const byteCharacters = atob(response.data.pdf_content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.data.filename || `invoice_${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('PDF downloaded successfully!');
      } else {
        toast.error('PDF content not found');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await axios.delete(`${API}/admin/invoices/${invoiceId}`);
      toast.success('Invoice deleted successfully');
      loadInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete invoice');
    }
  };

  const downloadBulkPDFs = async () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices to download');
      return;
    }
    
    try {
      setLoading(true);
      toast.info(`Downloading ${selectedInvoices.length} PDFs...`);
      
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoiceId = selectedInvoices[i];
        try {
          const response = await axios.get(`${API}/admin/invoices/${invoiceId}/pdf`);
          
          if (response.data.pdf_content) {
            // Convert base64 to blob
            const byteCharacters = atob(response.data.pdf_content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.filename || `invoice_${invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to download PDF for invoice ${invoiceId}:`, error);
        }
      }
      
      toast.success(`Downloaded ${selectedInvoices.length} PDFs successfully!`);
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Bulk PDF download error:', error);
      toast.error('Failed to download PDFs');
    } finally {
      setLoading(false);
    }
  };

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const statusIcons = {
      draft: <FileText className="w-3 h-3 mr-1" />,
      sent: <Send className="w-3 h-3 mr-1" />,
      paid: <CheckCircle className="w-3 h-3 mr-1" />,
      overdue: <AlertCircle className="w-3 h-3 mr-1" />,
      cancelled: <AlertCircle className="w-3 h-3 mr-1" />
    };

    return (
      <Badge className={`${statusStyles[status] || 'bg-gray-100 text-gray-800'} border-0 flex items-center`}>
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">Generate, track, and manage customer invoices</p>
        </div>
        <div className="flex space-x-2">
          {selectedInvoices.length > 0 && (
            <Button 
              onClick={downloadBulkPDFs}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download {selectedInvoices.length} PDFs
                </>
              )}
            </Button>
          )}
          <Button onClick={loadInvoices} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Invoices ({invoices.length})</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Generate ({completedBookings.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Search by customer name or invoice number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0))}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {invoices.filter(inv => inv.status === 'paid').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">
                      {invoices.filter(inv => inv.status === 'overdue').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                            } else {
                              setSelectedInvoices([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left p-4">Invoice #</th>
                      <th className="text-left p-4">Customer</th>
                      <th className="text-left p-4">Issue Date</th>
                      <th className="text-left p-4">Due Date</th>
                      <th className="text-left p-4">Amount</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => toggleInvoiceSelection(invoice.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{invoice.invoice_number}</div>
                          <div className="text-sm text-gray-500">#{invoice.id.slice(-8)}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{invoice.customer_name}</div>
                          <div className="text-sm text-gray-500">{invoice.customer_email}</div>
                        </td>
                        <td className="p-4">{formatDate(invoice.issue_date)}</td>
                        <td className="p-4">
                          {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(invoice.total_amount)}</td>
                        <td className="p-4">{getStatusBadge(invoice.status)}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoicePDF(invoice.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            
                            {invoice.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {invoice.status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {invoice.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteInvoice(invoice.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredInvoices.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No invoices found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Invoices Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Bookings Ready for Invoicing</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">Booking ID</th>
                      <th className="text-left p-4">Customer</th>
                      <th className="text-left p-4">Service Date</th>
                      <th className="text-left p-4">Services</th>
                      <th className="text-left p-4">Amount</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedBookings.map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="p-4">
                          <div className="font-medium">#{booking.id.slice(-8)}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">Customer {booking.customer_id.slice(-8)}</div>
                        </td>
                        <td className="p-4">{booking.booking_date}</td>
                        <td className="p-4">
                          <div>{booking.house_size} - {booking.frequency}</div>
                          {booking.a_la_carte_services && booking.a_la_carte_services.length > 0 && (
                            <div className="text-sm text-gray-500">
                              + {booking.a_la_carte_services.length} add-on(s)
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(booking.total_amount)}</td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            onClick={() => generateInvoice(booking.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Invoice
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {completedBookings.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No completed bookings available for invoicing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Dialog open={true} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedInvoice.invoice_number}</h3>
                  <p className="text-gray-600">Invoice ID: {selectedInvoice.id.slice(-8)}</p>
                </div>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Bill To</h4>
                <div>
                  <p className="font-medium">{selectedInvoice.customer_name}</p>
                  <p className="text-gray-600">{selectedInvoice.customer_email}</p>
                  {selectedInvoice.customer_address && (
                    <div className="text-sm text-gray-600 mt-1">
                      <p>{selectedInvoice.customer_address.street}</p>
                      <p>{selectedInvoice.customer_address.city}, {selectedInvoice.customer_address.state} {selectedInvoice.customer_address.zip_code}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">
                    {selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h4 className="font-semibold mb-3">Services</h4>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Service</th>
                        <th className="text-center p-3">Qty</th>
                        <th className="text-right p-3">Unit Price</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className={index < selectedInvoice.items.length - 1 ? 'border-b' : ''}>
                          <td className="p-3">
                            <div className="font-medium">{item.service_name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-600">{item.description}</div>
                            )}
                          </td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">{formatCurrency(item.unit_price)}</td>
                          <td className="text-right p-3 font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(selectedInvoice.tax_rate * 100).toFixed(2)}%):</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.tax_amount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-gray-600 text-sm">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => downloadInvoicePDF(selectedInvoice.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                
                {selectedInvoice.status === 'draft' && (
                  <Button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'sent')}>
                    <Send className="w-4 h-4 mr-2" />
                    Mark as Sent
                  </Button>
                )}
                
                {selectedInvoice.status !== 'paid' && (
                  <Button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'paid')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InvoiceManagement;