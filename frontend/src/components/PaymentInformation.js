import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Trash2, Star, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentInformation = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // New card form state
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    isPrimary: false
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API}/customer/payment-methods`);
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/customer/payment-methods`, {
        card_number: newCard.cardNumber,
        expiry_month: newCard.expiryMonth,
        expiry_year: newCard.expiryYear,
        cvv: newCard.cvv,
        cardholder_name: newCard.cardholderName,
        is_primary: newCard.isPrimary
      });

      setPaymentMethods([...paymentMethods, response.data]);
      setShowAddForm(false);
      setNewCard({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
        isPrimary: false
      });
      toast.success('Payment method added successfully');
    } catch (error) {
      toast.error('Failed to add payment method');
      console.error('Failed to add payment method:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (cardId) => {
    try {
      await axios.put(`${API}/customer/payment-methods/${cardId}/set-primary`);
      loadPaymentMethods(); // Reload to get updated data
      toast.success('Primary payment method updated');
    } catch (error) {
      toast.error('Failed to update primary payment method');
      console.error('Failed to set primary:', error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (paymentMethods.length <= 1) {
      toast.error('At least one active credit card must be on file to hold your appointments.');
      return;
    }

    setDeleting(cardId);
    try {
      await axios.delete(`${API}/customer/payment-methods/${cardId}`);
      setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
      toast.success('Payment method removed');
    } catch (error) {
      toast.error('Failed to remove payment method');
      console.error('Failed to delete payment method:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatCardNumber = (cardNumber) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const getCardType = (cardNumber) => {
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'American Express';
    return 'Credit Card';
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
          <h1 className="text-4xl font-bold text-gray-800">Payment Information</h1>
          <p className="text-xl text-gray-600 mt-2">Manage your saved payment methods</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Saved Payment Methods */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <CreditCard className="mr-2" size={24} />
                Saved Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Methods</h3>
                  <p className="text-gray-500 mb-4">Add a payment method to get started</p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-primary hover:bg-primary-light"
                  >
                    <Plus className="mr-2" size={16} />
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((card) => (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        card.is_primary ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <CreditCard className="text-gray-600" size={24} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-800">
                              {formatCardNumber(card.card_number)}
                            </span>
                            {card.is_primary && (
                              <Badge variant="secondary" className="flex items-center">
                                <Star className="mr-1" size={12} />
                                Primary Card
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {card.cardholder_name} • {getCardType(card.card_number)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!card.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(card.id)}
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                          disabled={deleting === card.id || (paymentMethods.length === 1)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-1" size={14} />
                          {deleting === card.id ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Card Form */}
          {showAddForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl">Add New Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCard} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={newCard.cardNumber}
                        onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cardholderName">Cardholder Name</Label>
                      <Input
                        id="cardholderName"
                        placeholder="John Doe"
                        value={newCard.cardholderName}
                        onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryMonth">Expiry Month</Label>
                        <Select
                          value={newCard.expiryMonth}
                          onValueChange={(value) => setNewCard({ ...newCard, expiryMonth: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                              <SelectItem key={month} value={String(month).padStart(2, '0')}>
                                {String(month).padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expiryYear">Expiry Year</Label>
                        <Select
                          value={newCard.expiryYear}
                          onValueChange={(value) => setNewCard({ ...newCard, expiryYear: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        maxLength="4"
                        value={newCard.cvv}
                        onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newCard.isPrimary}
                          onChange={(e) => setNewCard({ ...newCard, isPrimary: e.target.checked })}
                        />
                        <span className="text-sm text-gray-700">Set as primary payment method</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-primary-light"
                    >
                      {submitting ? 'Adding...' : 'Add Payment Method'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add New Card Button */}
          {!showAddForm && (
            <div className="text-center">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary-light"
              >
                <Plus className="mr-2" size={16} />
                Add New Card
              </Button>
            </div>
          )}

          {/* Important Notice */}
          <Alert className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> At least one active credit card must be on file to hold your appointments. 
              Your card will be charged automatically for scheduled cleanings.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default PaymentInformation;
