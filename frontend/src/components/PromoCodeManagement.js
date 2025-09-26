import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Calendar, 
  DollarSign, 
  Users, 
  Percent,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PromoCodeManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Form state for creating/editing promo codes
  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage', // 'percentage' or 'fixed'
    discount_value: '',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    usage_limit: '',
    usage_limit_per_customer: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
    applicable_services: [], // Array of service IDs
    applicable_customers: [] // Array of customer IDs (empty = all customers)
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/promo-codes`);
      setPromoCodes(response.data);
    } catch (error) {
      toast.error('Failed to load promo codes');
      console.error('Failed to load promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePromoCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setPromoForm({ ...promoForm, code: result });
  };

  const handleCreatePromo = async () => {
    try {
      // Validate required fields
      if (!promoForm.code || !promoForm.discount_value) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate discount value
      const discountValue = parseFloat(promoForm.discount_value);
      if (promoForm.discount_type === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
        toast.error('Percentage discount must be between 0 and 100');
        return;
      }
      if (promoForm.discount_type === 'fixed' && discountValue <= 0) {
        toast.error('Fixed discount must be greater than 0');
        return;
      }

      // Validate dates
      if (promoForm.valid_from && promoForm.valid_until) {
        const fromDate = new Date(promoForm.valid_from);
        const untilDate = new Date(promoForm.valid_until);
        if (fromDate >= untilDate) {
          toast.error('Valid until date must be after valid from date');
          return;
        }
      }

      // Clean up the form data - convert empty strings to null/undefined
      const promoData = {
        code: promoForm.code.trim().toUpperCase(),
        description: promoForm.description || null,
        discount_type: promoForm.discount_type,
        discount_value: parseFloat(promoForm.discount_value),
        minimum_order_amount: promoForm.minimum_order_amount && promoForm.minimum_order_amount.trim() ? parseFloat(promoForm.minimum_order_amount) : null,
        maximum_discount_amount: promoForm.maximum_discount_amount && promoForm.maximum_discount_amount.trim() ? parseFloat(promoForm.maximum_discount_amount) : null,
        usage_limit: promoForm.usage_limit && promoForm.usage_limit.trim() ? parseInt(promoForm.usage_limit) : null,
        usage_limit_per_customer: promoForm.usage_limit_per_customer && promoForm.usage_limit_per_customer.trim() ? parseInt(promoForm.usage_limit_per_customer) : 1,
        valid_from: promoForm.valid_from && promoForm.valid_from.trim() ? promoForm.valid_from : null,
        valid_until: promoForm.valid_until && promoForm.valid_until.trim() ? promoForm.valid_until : null,
        is_active: promoForm.is_active,
        applicable_services: promoForm.applicable_services || [],
        applicable_customers: promoForm.applicable_customers || []
      };

      await axios.post(`${API}/admin/promo-codes`, promoData);
      toast.success('Promo code created successfully');
      setShowCreateForm(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      toast.error('Failed to create promo code');
      console.error('Failed to create promo code:', error);
    }
  };

  const handleUpdatePromo = async () => {
    try {
      // Clean up the form data - convert empty strings to null/undefined
      const promoData = {
        code: promoForm.code.trim().toUpperCase(),
        description: promoForm.description || null,
        discount_type: promoForm.discount_type,
        discount_value: parseFloat(promoForm.discount_value),
        minimum_order_amount: promoForm.minimum_order_amount && promoForm.minimum_order_amount.trim() ? parseFloat(promoForm.minimum_order_amount) : null,
        maximum_discount_amount: promoForm.maximum_discount_amount && promoForm.maximum_discount_amount.trim() ? parseFloat(promoForm.maximum_discount_amount) : null,
        usage_limit: promoForm.usage_limit && promoForm.usage_limit.trim() ? parseInt(promoForm.usage_limit) : null,
        usage_limit_per_customer: promoForm.usage_limit_per_customer && promoForm.usage_limit_per_customer.trim() ? parseInt(promoForm.usage_limit_per_customer) : 1,
        valid_from: promoForm.valid_from && promoForm.valid_from.trim() ? promoForm.valid_from : null,
        valid_until: promoForm.valid_until && promoForm.valid_until.trim() ? promoForm.valid_until : null,
        is_active: promoForm.is_active,
        applicable_services: promoForm.applicable_services || [],
        applicable_customers: promoForm.applicable_customers || []
      };

      await axios.put(`${API}/admin/promo-codes/${editingPromo.id}`, promoData);
      toast.success('Promo code updated successfully');
      setEditingPromo(null);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      toast.error('Failed to update promo code');
      console.error('Failed to update promo code:', error);
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await axios.delete(`${API}/admin/promo-codes/${promoId}`);
      toast.success('Promo code deleted successfully');
      loadPromoCodes();
    } catch (error) {
      toast.error('Failed to delete promo code');
      console.error('Failed to delete promo code:', error);
    }
  };

  const togglePromoStatus = async (promoId, isActive) => {
    try {
      await axios.patch(`${API}/admin/promo-codes/${promoId}`, { is_active: !isActive });
      toast.success(`Promo code ${!isActive ? 'activated' : 'deactivated'}`);
      loadPromoCodes();
    } catch (error) {
      toast.error('Failed to update promo code status');
      console.error('Failed to update promo code status:', error);
    }
  };

  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard');
  };

  const resetForm = () => {
    setPromoForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_order_amount: '',
      maximum_discount_amount: '',
      usage_limit: '',
      usage_limit_per_customer: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
      applicable_services: [],
      applicable_customers: []
    });
  };

  const startEdit = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      minimum_order_amount: promo.minimum_order_amount?.toString() || '',
      maximum_discount_amount: promo.maximum_discount_amount?.toString() || '',
      usage_limit: promo.usage_limit?.toString() || '',
      usage_limit_per_customer: promo.usage_limit_per_customer?.toString() || '',
      valid_from: promo.valid_from ? promo.valid_from.split('T')[0] : '',
      valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : '',
      is_active: promo.is_active,
      applicable_services: promo.applicable_services || [],
      applicable_customers: promo.applicable_customers || []
    });
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

    if (!promo.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    if (validFrom && now < validFrom) {
      return <Badge variant="outline">Scheduled</Badge>;
    }

    if (validUntil && now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }

    return <Badge variant="secondary">Active</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No limit';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promo Code Management</h2>
          <p className="text-gray-600">Create and manage discount codes for customers</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary-light"
        >
          <Plus className="mr-2" size={16} />
          Create Promo Code
        </Button>
      </div>

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Features:</strong> All promo codes are validated server-side with usage limits, 
          expiration dates, and customer restrictions to prevent abuse.
        </AlertDescription>
      </Alert>

      {/* Promo Codes List */}
      <div className="grid gap-4">
        {promoCodes.map((promo) => (
          <Card key={promo.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{promo.code}</h3>
                    {getStatusBadge(promo)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPromoCode(promo.code)}
                    >
                      <Copy className="mr-1" size={14} />
                      Copy
                    </Button>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{promo.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Discount:</span>
                      <div className="font-medium">
                        {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}%` 
                          : `$${promo.discount_value}`
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <div className="font-medium">
                        {promo.usage_count || 0} / {promo.usage_limit || '∞'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Valid Until:</span>
                      <div className="font-medium">{formatDate(promo.valid_until)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Order:</span>
                      <div className="font-medium">
                        {promo.minimum_order_amount ? `$${promo.minimum_order_amount}` : 'No minimum'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(promo)}
                  >
                    <Edit className="mr-1" size={14} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                  >
                    {promo.is_active ? <EyeOff className="mr-1" size={14} /> : <Eye className="mr-1" size={14} />}
                    {promo.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePromo(promo.id)}
                  >
                    <Trash2 className="mr-1" size={14} />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Promo Code Dialog */}
      <Dialog open={showCreateForm || editingPromo} onOpenChange={(open) => {
        if (!open) {
          setShowCreateForm(false);
          setEditingPromo(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePromoCode}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    placeholder="20% off your first cleaning"
                  />
                </div>
              </div>
            </div>

            {/* Discount Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Discount Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type *</Label>
                  <Select
                    value={promoForm.discount_type}
                    onValueChange={(value) => setPromoForm({ ...promoForm, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discount_value">Discount Value *</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={promoForm.discount_value}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                    placeholder={promoForm.discount_type === 'percentage' ? '20' : '25.00'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum_order_amount">Minimum Order Amount</Label>
                  <Input
                    id="minimum_order_amount"
                    type="number"
                    step="0.01"
                    value={promoForm.minimum_order_amount}
                    onChange={(e) => setPromoForm({ ...promoForm, minimum_order_amount: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maximum_discount_amount">Maximum Discount Amount</Label>
                  <Input
                    id="maximum_discount_amount"
                    type="number"
                    step="0.01"
                    value={promoForm.maximum_discount_amount}
                    onChange={(e) => setPromoForm({ ...promoForm, maximum_discount_amount: e.target.value })}
                    placeholder="50.00"
                  />
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Usage Limits</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Total Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={promoForm.usage_limit}
                    onChange={(e) => setPromoForm({ ...promoForm, usage_limit: e.target.value })}
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="usage_limit_per_customer">Usage Limit Per Customer</Label>
                  <Input
                    id="usage_limit_per_customer"
                    type="number"
                    value={promoForm.usage_limit_per_customer}
                    onChange={(e) => setPromoForm({ ...promoForm, usage_limit_per_customer: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Validity Period</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={promoForm.valid_from}
                    onChange={(e) => setPromoForm({ ...promoForm, valid_from: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={promoForm.valid_until}
                    onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={promoForm.is_active}
                  onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPromo(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingPromo ? handleUpdatePromo : handleCreatePromo}
                className="bg-primary hover:bg-primary-light"
              >
                {editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodeManagement;
