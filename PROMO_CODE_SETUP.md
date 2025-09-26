# Promo Code System Setup Guide

## Overview
The promo code system has been successfully implemented with robust security measures to prevent abuse. This guide explains how to set up and use the system.

## Backend Setup

### 1. Start the Backend Server
```bash
cd backend
python server.py
```

The server will start on `http://localhost:8000` and automatically create the necessary database collections.

### 2. Test the System
Run the test script to verify everything works:
```bash
python test_promo_system.py
```

## Frontend Setup

### 1. Start the Frontend
```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

### 2. Access Admin Dashboard
1. Go to `http://localhost:3000/admin/login`
2. Login with: `admin@maids.com` / `admin123`
3. Navigate to the "Promo Codes" tab

### 3. Create Your First Promo Code
1. Click "Create Promo Code"
2. Fill in the details:
   - **Code**: `WELCOME20`
   - **Description**: `20% off for new customers`
   - **Discount Type**: `Percentage`
   - **Discount Value**: `20`
   - **Minimum Order**: `100`
   - **Usage Limit**: `50`
   - **Valid Until**: Set a future date
3. Click "Create Promo Code"

## Security Features

### ✅ **Server-Side Validation**
- All promo code validation happens on the backend
- No client-side price manipulation possible
- Atomic database operations prevent race conditions

### ✅ **Usage Tracking**
- Per-customer usage limits
- Total usage limits
- Audit trail for all activities
- Prevents duplicate usage

### ✅ **Business Logic Protection**
- Date range validation
- Minimum order requirements
- Maximum discount caps
- Customer eligibility checks

### ✅ **Rate Limiting**
- 10 validation requests per minute per IP
- Prevents brute force attempts
- Protects against abuse

## API Endpoints

### Customer Endpoints
- `POST /api/validate-promo-code` - Validate and calculate discount

### Admin Endpoints
- `GET /api/admin/promo-codes` - Get all promo codes
- `POST /api/admin/promo-codes` - Create new promo code
- `PUT /api/admin/promo-codes/{id}` - Update promo code
- `PATCH /api/admin/promo-codes/{id}` - Toggle status
- `DELETE /api/admin/promo-codes/{id}` - Delete promo code

## Database Collections

The system automatically creates these MongoDB collections:
- `promo_codes` - Stores promo code definitions
- `promo_code_usage` - Tracks usage history
- `bookings` - Updated to include promo code information

## Testing the System

### 1. Create a Test Promo Code
```json
{
  "code": "TEST20",
  "description": "20% off test",
  "discount_type": "percentage",
  "discount_value": 20.0,
  "minimum_order_amount": 100.0,
  "usage_limit": 10,
  "is_active": true
}
```

### 2. Test Customer Experience
1. Go to `http://localhost:3000`
2. Login as customer: `test@maids.com` / `test@maids@1234`
3. Click "Book Appointment"
4. Go through the booking flow
5. In the confirmation step, enter promo code: `TEST20`
6. See the discount applied in real-time

## Security Best Practices

### 1. **Never Trust Client-Side Data**
- All validation happens server-side
- Discount calculations are performed on the backend
- Usage limits are enforced at the database level

### 2. **Audit Everything**
- All promo code activities are logged
- Usage history is tracked
- Failed attempts are monitored

### 3. **Rate Limiting**
- Implemented to prevent abuse
- Configurable per endpoint
- Protects against brute force

### 4. **Input Validation**
- All inputs are sanitized
- SQL injection prevention
- XSS protection

## Monitoring

### Key Metrics to Track
- Promo code usage rates
- Failed validation attempts
- Revenue impact
- Unusual usage patterns

### Alerts to Set Up
- High rate of failed validations
- Unusual discount amounts
- Promo code abuse patterns
- System errors

## Troubleshooting

### Common Issues

1. **404 Error on Promo Code Endpoints**
   - Ensure backend server is running
   - Check that the API routes are properly included
   - Verify MongoDB connection

2. **Promo Code Not Working**
   - Check if promo code is active
   - Verify date ranges
   - Check usage limits
   - Ensure minimum order amount is met

3. **Frontend Not Loading**
   - Check if frontend server is running
   - Verify API URL configuration
   - Check browser console for errors

### Debug Steps
1. Check backend logs for errors
2. Verify database collections exist
3. Test API endpoints with Postman
4. Check browser network tab for failed requests

## Production Deployment

### 1. **Environment Variables**
```bash
MONGODB_URL=mongodb://your-mongodb-url
JWT_SECRET=your-secure-jwt-secret
```

### 2. **Database Indexes**
The system automatically creates necessary indexes, but for production:
```javascript
db.promo_codes.createIndex({ "code": 1 }, { unique: true })
db.promo_codes.createIndex({ "is_active": 1, "valid_from": 1, "valid_until": 1 })
db.promo_code_usage.createIndex({ "customer_id": 1, "promo_code_id": 1 })
```

### 3. **Security Headers**
Ensure your production server has proper security headers:
- CORS configuration
- Rate limiting
- Input validation
- Authentication

## Support

If you encounter any issues:
1. Check the logs for error messages
2. Run the test script to verify functionality
3. Verify all environment variables are set
4. Ensure MongoDB is accessible

The promo code system is now fully functional with enterprise-grade security measures!
