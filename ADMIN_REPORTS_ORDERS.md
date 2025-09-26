# Admin Reports & Order Management

## Overview
The admin dashboard now includes comprehensive reporting features and order management capabilities for handling customer cancellations and rescheduling requests.

## Features

### 📊 Reports & Analytics

#### Weekly Reports
- **Total Bookings**: Number of bookings for the current week
- **Revenue**: Total revenue generated for the week
- **Cancellations**: Number of cancelled bookings
- **Reschedules**: Number of rescheduled bookings
- **Completion Rate**: Percentage of completed bookings
- **Customer Satisfaction**: Customer satisfaction score
- **Average Booking Value**: Average value per booking

#### Monthly Reports
- Same metrics as weekly reports but for the current month
- Provides broader business insights and trends

#### Report Export
- Export weekly and monthly reports as CSV files
- Includes detailed booking data for analysis
- Downloadable reports for external analysis

### 📋 Order Management

#### Pending Cancellations
- View all pending cancellation requests from customers
- Approve or deny cancellation requests
- Track cancellation reasons and timing

#### Pending Reschedules
- View all pending reschedule requests from customers
- Approve or deny reschedule requests
- See original and new booking dates

#### Order History
- Track all recent cancellations and reschedules
- View order change history for the last 30 days
- Monitor customer behavior patterns

## API Endpoints

### Reports
- `GET /api/admin/reports/weekly` - Get weekly report data
- `GET /api/admin/reports/monthly` - Get monthly report data
- `GET /api/admin/reports/{type}/export` - Export report as CSV

### Order Management
- `GET /api/admin/orders/pending` - Get pending cancellations and reschedules
- `GET /api/admin/orders/history` - Get order change history
- `POST /api/admin/orders/{order_id}/approve_cancellation` - Approve cancellation
- `POST /api/admin/orders/{order_id}/deny_cancellation` - Deny cancellation
- `POST /api/admin/orders/{order_id}/approve_reschedule` - Approve reschedule
- `POST /api/admin/orders/{order_id}/deny_reschedule` - Deny reschedule

## Usage

### Accessing Reports
1. Login to admin dashboard
2. Navigate to "Reports" tab
3. View weekly and monthly analytics
4. Export reports as needed

### Managing Orders
1. Navigate to "Orders" tab
2. Review pending cancellations and reschedules
3. Approve or deny requests as appropriate
4. Monitor order history for insights

## Data Structure

### Report Data
```json
{
  "totalBookings": 25,
  "revenue": 2500.00,
  "cancellations": 2,
  "reschedules": 3,
  "completionRate": 85.0,
  "customerSatisfaction": 95.0,
  "avgBookingValue": 100.00
}
```

### Pending Orders
```json
{
  "cancellations": [
    {
      "id": "booking_123",
      "customer_name": "Customer ABC12345",
      "booking_date": "2024-01-15",
      "total_amount": 150.00
    }
  ],
  "reschedules": [
    {
      "id": "booking_456",
      "customer_name": "Customer DEF67890",
      "original_date": "2024-01-15",
      "new_date": "2024-01-20",
      "total_amount": 200.00
    }
  ]
}
```

## Security

- All endpoints require admin authentication
- Order actions are logged for audit purposes
- Customer data is anonymized in reports
- Export functionality includes data validation

## Future Enhancements

- Real-time notifications for pending orders
- Advanced analytics with charts and graphs
- Automated approval workflows
- Customer communication integration
- Performance metrics and KPIs
