import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      const response = await axios.get(`${API}/customer/payment-history`);
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (paymentId) => {
    try {
      const response = await axios.get(`${API}/customer/invoice/${paymentId}`);
      setSelectedInvoice(response.data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    try {
      const response = await axios.get(`${API}/customer/invoice/${paymentId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    return `**** **** **** ${method.last_four}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-800">Payment History</h1>
          <p className="text-xl text-gray-600 mt-2">View your past payments and invoices</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payment History</h3>
                <p className="text-gray-500 mb-4">You haven't made any payments yet.</p>
                <Button onClick={() => navigate('/')} variant="outline">
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Payment History Table */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <DollarSign className="mr-2" size={24} />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date of Service</TableHead>
                          <TableHead>Rooms/Areas</TableHead>
                          <TableHead>Add-ons</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="mr-2" size={16} />
                                {formatDate(payment.service_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {payment.rooms?.map((room, index) => (
                                  <span key={index} className="block">
                                    {room.name}: {room.count}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {payment.add_ons?.length > 0 ? (
                                  payment.add_ons.map((addon, index) => (
                                    <span key={index} className="block">
                                      {addon.name} (x{addon.quantity})
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-500">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-primary">
                                ${payment.total_amount?.toFixed(2) || '0.00'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CreditCard className="mr-2" size={16} />
                                {formatPaymentMethod(payment.payment_method)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewInvoice(payment.id)}
                                    >
                                      <Eye className="mr-1" size={14} />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Invoice #{payment.invoice_number || payment.id}</DialogTitle>
                                    </DialogHeader>
                                    {selectedInvoice && (
                                      <div className="space-y-6">
                                        {/* Business Header */}
                                        <div className="text-center border-b pb-4">
                                          <h2 className="text-2xl font-bold text-gray-800">Maids of CyFair</h2>
                                          <p className="text-gray-600">Professional Cleaning Services</p>
                                        </div>

                                        {/* Customer Info */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                          <div>
                                            <h3 className="font-semibold text-gray-800 mb-2">Bill To:</h3>
                                            <div className="text-sm text-gray-600">
                                              <div>{selectedInvoice.customer_name}</div>
                                              <div>{selectedInvoice.customer_email}</div>
                                              <div>{selectedInvoice.customer_phone}</div>
                                            </div>
                                          </div>
                                          <div>
                                            <h3 className="font-semibold text-gray-800 mb-2">Service Details:</h3>
                                            <div className="text-sm text-gray-600">
                                              <div>Date: {formatDate(selectedInvoice.service_date)}</div>
                                              <div>Time: {selectedInvoice.time_slot}</div>
                                              <div>Invoice #: {selectedInvoice.invoice_number || selectedInvoice.id}</div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Itemized Charges */}
                                        <div>
                                          <h3 className="font-semibold text-gray-800 mb-3">Service Details</h3>
                                          <div className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 border-b">
                                              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700">
                                                <div>Description</div>
                                                <div className="text-right">Quantity</div>
                                                <div className="text-right">Amount</div>
                                              </div>
                                            </div>
                                            <div className="divide-y">
                                              {/* Base Service */}
                                              <div className="px-4 py-3">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                  <div>Base Cleaning Service ({selectedInvoice.house_size} sq ft)</div>
                                                  <div className="text-right">1</div>
                                                  <div className="text-right">${selectedInvoice.base_price?.toFixed(2) || '0.00'}</div>
                                                </div>
                                              </div>
                                              
                                              {/* Add-ons */}
                                              {selectedInvoice.add_ons?.map((addon, index) => (
                                                <div key={index} className="px-4 py-3">
                                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>{addon.name}</div>
                                                    <div className="text-right">{addon.quantity}</div>
                                                    <div className="text-right">${(addon.price * addon.quantity).toFixed(2)}</div>
                                                  </div>
                                                </div>
                                              ))}
                                              
                                              {/* Processing Fee */}
                                              {selectedInvoice.processing_fee > 0 && (
                                                <div className="px-4 py-3">
                                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>Processing Fee</div>
                                                    <div className="text-right">1</div>
                                                    <div className="text-right">${selectedInvoice.processing_fee.toFixed(2)}</div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="border-t pt-4">
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span>Subtotal:</span>
                                              <span>${selectedInvoice.subtotal?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            {selectedInvoice.discount > 0 && (
                                              <div className="flex justify-between text-green-600">
                                                <span>Discount:</span>
                                                <span>-${selectedInvoice.discount.toFixed(2)}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                              <span>Total:</span>
                                              <span>${selectedInvoice.total_amount?.toFixed(2) || '0.00'}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Payment Info */}
                                        <div className="border-t pt-4">
                                          <h3 className="font-semibold text-gray-800 mb-2">Payment Information</h3>
                                          <div className="text-sm text-gray-600">
                                            <div>Payment Method: {formatPaymentMethod(selectedInvoice.payment_method)}</div>
                                            <div>Status: {getStatusBadge(selectedInvoice.status)}</div>
                                            <div>Payment Date: {formatDate(selectedInvoice.payment_date)}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(payment.id)}
                                >
                                  <Download className="mr-1" size={14} />
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
