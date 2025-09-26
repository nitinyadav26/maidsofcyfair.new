# Comprehensive Test Plan for Maids of Cyfair Application

## Overview
This document outlines comprehensive testing strategies for the Maids of Cyfair booking system, covering both frontend (React) and backend (FastAPI) components, as well as the Flutter mobile application.

## Test Scope
- **Frontend**: React application with customer booking portal and admin dashboard
- **Backend**: FastAPI REST API with MongoDB database
- **Mobile**: Flutter application for cleaners
- **Integration**: Google Calendar integration
- **Authentication**: JWT-based authentication system

## 1. Backend API Testing

### 1.1 Authentication Endpoints
- **POST /api/auth/register**
  - Test valid user registration
  - Test duplicate email handling
  - Test invalid email format
  - Test missing required fields
  - Test password validation

- **POST /api/auth/login**
  - Test valid login credentials
  - Test invalid email
  - Test invalid password
  - Test non-existent user
  - Test JWT token generation

- **GET /api/auth/me**
  - Test with valid token
  - Test with invalid token
  - Test with expired token
  - Test without token

### 1.2 Service Management
- **GET /api/services**
  - Test retrieving all services
  - Test service data structure
  - Test empty service list

- **GET /api/services/standard**
  - Test standard services only
  - Test service categorization

- **GET /api/services/a-la-carte**
  - Test a-la-carte services only
  - Test pricing information

- **GET /api/pricing/{house_size}/{frequency}**
  - Test all house size combinations
  - Test all frequency options
  - Test invalid parameters
  - Test pricing calculations

### 1.3 Time Slot Management
- **GET /api/time-slots**
  - Test with valid date
  - Test with invalid date format
  - Test with past date
  - Test with future date
  - Test available slots filtering

- **GET /api/available-dates**
  - Test date range retrieval
  - Test date formatting
  - Test empty availability

### 1.4 Booking System
- **POST /api/bookings**
  - Test authenticated user booking
  - Test complete booking data
  - Test missing required fields
  - Test invalid house size
  - Test invalid frequency
  - Test time slot availability

- **POST /api/bookings/guest**
  - Test guest user booking
  - Test customer information validation
  - Test guest booking limitations

- **GET /api/bookings**
  - Test user's booking history
  - Test booking data structure
  - Test empty booking list

- **GET /api/bookings/{booking_id}**
  - Test valid booking ID
  - Test invalid booking ID
  - Test unauthorized access
  - Test booking ownership

### 1.5 Promo Code System
- **POST /api/validate-promo-code**
  - Test valid promo code
  - Test invalid promo code
  - Test expired promo code
  - Test usage limit exceeded
  - Test minimum order amount
  - Test discount calculations

- **GET /api/admin/promo-codes**
  - Test admin access required
  - Test promo code listing
  - Test usage statistics

- **POST /api/admin/promo-codes**
  - Test promo code creation
  - Test duplicate code handling
  - Test validation rules
  - Test date range validation

### 1.6 Admin Dashboard
- **GET /api/admin/stats**
  - Test admin authentication
  - Test statistics calculation
  - Test data accuracy

- **GET /api/admin/bookings**
  - Test all bookings retrieval
  - Test booking filtering
  - Test pagination

- **GET /api/admin/cleaners**
  - Test cleaner listing
  - Test cleaner data structure

- **POST /api/admin/cleaners**
  - Test cleaner creation
  - Test validation rules
  - Test duplicate email handling

### 1.7 Google Calendar Integration
- **POST /api/admin/cleaners/{cleaner_id}/calendar/setup**
  - Test calendar setup
  - Test credential validation
  - Test invalid cleaner ID

- **GET /api/admin/cleaners/{cleaner_id}/calendar/events**
  - Test event retrieval
  - Test date range filtering
  - Test calendar access

- **GET /api/admin/calendar/availability-summary**
  - Test availability calculation
  - Test multiple cleaners
  - Test time slot conflicts

- **POST /api/admin/calendar/assign-job**
  - Test job assignment
  - Test availability checking
  - Test conflict resolution

### 1.8 Invoice Management
- **GET /api/admin/invoices**
  - Test invoice listing
  - Test status filtering
  - Test pagination

- **POST /api/admin/invoices/generate/{booking_id}**
  - Test invoice generation
  - Test booking validation
  - Test duplicate invoice prevention

- **GET /api/admin/invoices/{invoice_id}/pdf**
  - Test PDF generation
  - Test invoice data accuracy
  - Test PDF formatting

### 1.9 Reports and Analytics
- **GET /api/admin/reports/weekly**
  - Test weekly data calculation
  - Test date range accuracy
  - Test metric calculations

- **GET /api/admin/reports/monthly**
  - Test monthly data calculation
  - Test year boundary handling
  - Test metric accuracy

- **GET /api/admin/export/bookings**
  - Test CSV export
  - Test data formatting
  - Test file generation

## 2. Frontend Testing

### 2.1 Authentication Components
- **Login Component**
  - Test form validation
  - Test error handling
  - Test successful login
  - Test redirect after login
  - Test token storage

- **Register Component**
  - Test form validation
  - Test password confirmation
  - Test email validation
  - Test successful registration
  - Test error messages

- **Admin Login Component**
  - Test admin authentication
  - Test role-based redirect
  - Test unauthorized access

### 2.2 Booking Flow
- **BookingFlow Component**
  - Test step navigation
  - Test form validation
  - Test data persistence between steps
  - Test service selection
  - Test date/time selection
  - Test address validation
  - Test special instructions
  - Test booking confirmation

- **Service Selection**
  - Test standard service selection
  - Test a-la-carte service selection
  - Test pricing calculations
  - Test service combinations

- **Time Slot Selection**
  - Test available date display
  - Test time slot availability
  - Test slot selection
  - Test booking conflicts

### 2.3 Admin Dashboard
- **AdminDashboard Component**
  - Test dashboard loading
  - Test statistics display
  - Test navigation
  - Test responsive design

- **Booking Management**
  - Test booking listing
  - Test booking filtering
  - Test booking status updates
  - Test booking details

- **Cleaner Management**
  - Test cleaner listing
  - Test cleaner creation
  - Test cleaner editing
  - Test cleaner deletion

- **Service Management**
  - Test service listing
  - Test service creation
  - Test service editing
  - Test service deletion

### 2.4 Customer Dashboard
- **CustomerDashboard Component**
  - Test user information display
  - Test booking history
  - Test booking details
  - Test navigation

- **Payment Management**
  - Test payment history
  - Test payment information
  - Test payment methods

- **Appointment Management**
  - Test reschedule functionality
  - Test cancellation process
  - Test appointment details

### 2.5 Promo Code Management
- **PromoCodeManagement Component**
  - Test promo code listing
  - Test promo code creation
  - Test promo code editing
  - Test promo code deletion
  - Test validation rules

### 2.6 Calendar Integration
- **CalendarIntegration Component**
  - Test calendar setup
  - Test availability display
  - Test job assignment
  - Test conflict resolution

- **CalendarJobAssignment Component**
  - Test drag-and-drop functionality
  - Test job assignment
  - Test time slot conflicts
  - Test cleaner availability

### 2.7 Invoice Management
- **InvoiceManagement Component**
  - Test invoice listing
  - Test invoice generation
  - Test PDF download
  - Test invoice status updates

## 3. Flutter Mobile App Testing

### 3.1 Authentication
- **Login Screen**
  - Test login form validation
  - Test authentication flow
  - Test error handling
  - Test token storage
  - Test offline handling

### 3.2 Job Management
- **Home Screen**
  - Test job listing
  - Test job filtering
  - Test job status display
  - Test navigation

- **Job Detail Screen**
  - Test job information display
  - Test customer details
  - Test service information
  - Test special instructions

### 3.3 Time Tracking
- **Timer Functionality**
  - Test clock in/out
  - Test time calculation
  - Test timer persistence
  - Test work summary

### 3.4 Checklist System
- **Interactive Checklist**
  - Test task completion
  - Test progress tracking
  - Test required vs optional tasks
  - Test checklist persistence

### 3.5 Communication
- **Customer Communication**
  - Test ETA updates
  - Test customer contact
  - Test message sending
  - Test notification handling

## 4. Integration Testing

### 4.1 API Integration
- Test frontend-backend communication
- Test authentication flow
- Test data synchronization
- Test error handling
- Test offline scenarios

### 4.2 Google Calendar Integration
- Test calendar authentication
- Test event creation
- Test availability checking
- Test conflict resolution
- Test data synchronization

### 4.3 Database Integration
- Test data persistence
- Test data retrieval
- Test data validation
- Test data integrity
- Test transaction handling

## 5. Performance Testing

### 5.1 Backend Performance
- Test API response times
- Test concurrent user handling
- Test database query optimization
- Test memory usage
- Test CPU usage

### 5.2 Frontend Performance
- Test page load times
- Test component rendering
- Test state management
- Test memory usage
- Test bundle size

### 5.3 Mobile App Performance
- Test app startup time
- Test screen transitions
- Test data loading
- Test memory usage
- Test battery usage

## 6. Security Testing

### 6.1 Authentication Security
- Test JWT token validation
- Test token expiration
- Test unauthorized access
- Test role-based access control
- Test password security

### 6.2 API Security
- Test input validation
- Test SQL injection prevention
- Test XSS prevention
- Test CSRF protection
- Test rate limiting

### 6.3 Data Security
- Test data encryption
- Test sensitive data handling
- Test data transmission security
- Test data storage security

## 7. Usability Testing

### 7.1 User Experience
- Test navigation flow
- Test form usability
- Test error messages
- Test loading states
- Test responsive design

### 7.2 Accessibility
- Test screen reader compatibility
- Test keyboard navigation
- Test color contrast
- Test font sizes
- Test accessibility standards

## 8. Test Execution Strategy

### 8.1 Test Environment Setup
- Development environment
- Staging environment
- Production environment
- Test data setup
- Test user accounts

### 8.2 Test Data Management
- Test user creation
- Test booking data
- Test service data
- Test calendar data
- Test cleanup procedures

### 8.3 Test Automation
- Unit test automation
- Integration test automation
- API test automation
- UI test automation
- Mobile test automation

## 9. Test Reporting

### 9.1 Test Results
- Test execution reports
- Bug reports
- Performance reports
- Security reports
- Usability reports

### 9.2 Metrics and KPIs
- Test coverage
- Bug density
- Performance metrics
- Security metrics
- User satisfaction

## 10. Test Maintenance

### 10.1 Test Updates
- Test case updates
- Test data updates
- Test environment updates
- Test tool updates

### 10.2 Continuous Testing
- Automated test execution
- Continuous integration
- Continuous deployment
- Test monitoring
- Test reporting

This comprehensive test plan ensures thorough testing of all components of the Maids of Cyfair application, covering functionality, performance, security, and usability aspects.
