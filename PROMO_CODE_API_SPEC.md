# Promo Code API Specification

## Overview
This document outlines the secure promo code system implementation for the maid service booking platform. The system includes robust validation, usage tracking, and security measures to prevent abuse.

## Database Schema

### PromoCodes Table
```sql
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    minimum_order_amount DECIMAL(10,2),
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_customer INTEGER DEFAULT 1,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    applicable_services UUID[],
    applicable_customers UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);
```

### PromoCodeUsage Table
```sql
CREATE TABLE promo_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    booking_id UUID REFERENCES bookings(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_usage_customer ON promo_code_usage(customer_id, promo_code_id);
CREATE INDEX idx_promo_usage_booking ON promo_code_usage(booking_id);
```

## API Endpoints

### 1. Admin Promo Code Management

#### GET /api/admin/promo-codes
**Description:** Get all promo codes with usage statistics
**Authentication:** Admin required
**Response:**
```json
[
  {
    "id": "uuid",
    "code": "SAVE20",
    "description": "20% off first cleaning",
    "discount_type": "percentage",
    "discount_value": 20.00,
    "minimum_order_amount": 100.00,
    "maximum_discount_amount": 50.00,
    "usage_limit": 100,
    "usage_count": 25,
    "usage_limit_per_customer": 1,
    "valid_from": "2024-01-01T00:00:00Z",
    "valid_until": "2024-12-31T23:59:59Z",
    "is_active": true,
    "applicable_services": ["uuid1", "uuid2"],
    "applicable_customers": [],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/admin/promo-codes
**Description:** Create a new promo code
**Authentication:** Admin required
**Request Body:**
```json
{
  "code": "SAVE20",
  "description": "20% off first cleaning",
  "discount_type": "percentage",
  "discount_value": 20.00,
  "minimum_order_amount": 100.00,
  "maximum_discount_amount": 50.00,
  "usage_limit": 100,
  "usage_limit_per_customer": 1,
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-12-31T23:59:59Z",
  "is_active": true,
  "applicable_services": ["uuid1", "uuid2"],
  "applicable_customers": []
}
```

#### PUT /api/admin/promo-codes/{id}
**Description:** Update a promo code
**Authentication:** Admin required

#### DELETE /api/admin/promo-codes/{id}
**Description:** Delete a promo code
**Authentication:** Admin required

#### PATCH /api/admin/promo-codes/{id}
**Description:** Toggle promo code active status
**Authentication:** Admin required
**Request Body:**
```json
{
  "is_active": false
}
```

### 2. Customer Promo Code Validation

#### POST /api/validate-promo-code
**Description:** Validate and calculate discount for a promo code
**Authentication:** Customer required
**Request Body:**
```json
{
  "code": "SAVE20",
  "subtotal": 150.00
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "promo": {
    "id": "uuid",
    "code": "SAVE20",
    "description": "20% off first cleaning",
    "discount_type": "percentage",
    "discount_value": 20.00,
    "maximum_discount_amount": 50.00
  },
  "discount": 30.00,
  "final_amount": 120.00
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Promo code has expired"
}
```

## Security Implementation

### 1. Server-Side Validation
All promo code validation must be performed server-side to prevent client-side manipulation:

```python
def validate_promo_code(code: str, customer_id: str, subtotal: float) -> dict:
    """
    Comprehensive promo code validation with security checks
    """
    # 1. Basic validation
    if not code or len(code.strip()) == 0:
        return {"valid": False, "message": "Promo code is required"}
    
    # 2. Database lookup
    promo = get_promo_code_by_code(code.upper())
    if not promo:
        return {"valid": False, "message": "Invalid promo code"}
    
    # 3. Active status check
    if not promo.is_active:
        return {"valid": False, "message": "Promo code is not active"}
    
    # 4. Date validation
    now = datetime.utcnow()
    if promo.valid_from and now < promo.valid_from:
        return {"valid": False, "message": "Promo code is not yet valid"}
    
    if promo.valid_until and now > promo.valid_until:
        return {"valid": False, "message": "Promo code has expired"}
    
    # 5. Usage limit validation
    if promo.usage_limit and promo.usage_count >= promo.usage_limit:
        return {"valid": False, "message": "Promo code usage limit reached"}
    
    # 6. Customer usage limit validation
    customer_usage = get_customer_promo_usage(customer_id, promo.id)
    if promo.usage_limit_per_customer and customer_usage >= promo.usage_limit_per_customer:
        return {"valid": False, "message": "You have already used this promo code"}
    
    # 7. Minimum order amount validation
    if promo.minimum_order_amount and subtotal < promo.minimum_order_amount:
        return {"valid": False, "message": f"Minimum order amount of ${promo.minimum_order_amount} required"}
    
    # 8. Service applicability validation
    if promo.applicable_services:
        # Check if any selected services match applicable services
        # This would need to be passed from the booking context
        pass
    
    # 9. Customer applicability validation
    if promo.applicable_customers and customer_id not in promo.applicable_customers:
        return {"valid": False, "message": "Promo code not applicable to your account"}
    
    # 10. Calculate discount
    discount = calculate_discount(promo, subtotal)
    
    return {
        "valid": True,
        "promo": promo,
        "discount": discount,
        "final_amount": subtotal - discount
    }
```

### 2. Discount Calculation
```python
def calculate_discount(promo: PromoCode, subtotal: float) -> float:
    """
    Calculate discount amount with security checks
    """
    if promo.discount_type == "percentage":
        discount = (subtotal * promo.discount_value) / 100
    else:  # fixed
        discount = promo.discount_value
    
    # Apply maximum discount limit
    if promo.maximum_discount_amount:
        discount = min(discount, promo.maximum_discount_amount)
    
    # Ensure discount doesn't exceed subtotal
    discount = min(discount, subtotal)
    
    # Round to 2 decimal places
    return round(discount, 2)
```

### 3. Usage Tracking
```python
def record_promo_usage(promo_id: str, customer_id: str, booking_id: str, discount_amount: float):
    """
    Record promo code usage with atomic operations
    """
    with db.transaction():
        # Increment usage count atomically
        promo = PromoCode.query.filter_by(id=promo_id).with_for_update().first()
        promo.usage_count += 1
        db.session.commit()
        
        # Record usage
        usage = PromoCodeUsage(
            promo_code_id=promo_id,
            customer_id=customer_id,
            booking_id=booking_id,
            discount_amount=discount_amount
        )
        db.session.add(usage)
        db.session.commit()
```

## Security Measures

### 1. Rate Limiting
- Limit promo code validation requests to 10 per minute per IP
- Limit promo code creation to 5 per hour per admin

### 2. Input Validation
- Sanitize all input fields
- Validate discount values (0 < percentage <= 100, fixed > 0)
- Validate date ranges
- Prevent SQL injection with parameterized queries

### 3. Audit Logging
```python
def log_promo_activity(action: str, promo_id: str, customer_id: str, details: dict):
    """
    Log all promo code activities for audit trail
    """
    audit_log = PromoCodeAuditLog(
        action=action,
        promo_code_id=promo_id,
        customer_id=customer_id,
        details=details,
        timestamp=datetime.utcnow(),
        ip_address=request.remote_addr
    )
    db.session.add(audit_log)
    db.session.commit()
```

### 4. Database Constraints
- Unique constraint on promo code
- Check constraints on discount values
- Foreign key constraints with cascade delete
- Indexes for performance

### 5. Business Logic Validation
- Prevent overlapping date ranges for same customer
- Validate service applicability
- Check customer eligibility
- Ensure atomic operations for usage tracking

## Error Handling

### Common Error Messages
- "Invalid promo code"
- "Promo code has expired"
- "Promo code is not active"
- "Minimum order amount not met"
- "Promo code usage limit reached"
- "You have already used this promo code"
- "Promo code not applicable to your account"

### HTTP Status Codes
- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized
- 403: Forbidden (admin required)
- 404: Not Found
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error

## Testing Requirements

### Unit Tests
- Promo code validation logic
- Discount calculation
- Usage tracking
- Date validation
- Input sanitization

### Integration Tests
- API endpoint testing
- Database transaction testing
- Rate limiting testing
- Security testing

### Security Tests
- SQL injection attempts
- Rate limiting bypass attempts
- Unauthorized access attempts
- Input validation testing

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling
- Query optimization
- Caching for frequently accessed promo codes

### Caching Strategy
- Cache active promo codes
- Cache validation results (short TTL)
- Invalidate cache on promo code updates

## Monitoring and Alerting

### Metrics to Track
- Promo code usage rates
- Failed validation attempts
- Revenue impact of promo codes
- Unusual usage patterns

### Alerts
- High rate of failed validations
- Unusual discount amounts
- Promo code abuse patterns
- System errors in promo validation

This specification ensures a robust, secure, and scalable promo code system that prevents abuse while providing a smooth user experience.
