# Maids of Cyfair - Cleaner Mobile App

A Flutter mobile application for cleaners to manage their assigned jobs, track time, and communicate with customers.

## Features

### 🔐 Authentication
- Login system for cleaners
- Demo credentials for testing
- Secure JWT token management

### 📱 Job Management
- View assigned jobs (today, upcoming, completed)
- Job details with customer information
- Real-time job status updates
- Interactive job checklist
- Progress tracking

### ⏰ Time Tracking
- Clock in/out functionality
- Real-time work duration tracking
- Job timer with visual indicators
- Work summary reports

### 📋 Interactive Checklist
- Dynamic checklist based on job type
- Mark tasks as completed
- Progress percentage calculation
- Required vs optional tasks

### 💬 Customer Communication
- Update ETA for customers
- Contact customer directly
- Job notes and special instructions

### 📊 Performance Dashboard
- Job statistics and metrics
- Completion rates
- Rating display
- Work history

## Tech Stack

- **Framework**: Flutter 3.0+
- **State Management**: Provider
- **HTTP Client**: Dio & HTTP
- **Local Storage**: SharedPreferences
- **UI Components**: Material Design 3
- **Animations**: Custom animations with AnimationController

## Architecture

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── cleaner.dart
│   ├── job.dart
│   └── customer.dart
├── services/                 # Business logic services
│   ├── api_service.dart      # HTTP API communication
│   ├── auth_service.dart     # Authentication management
│   └── job_service.dart      # Job operations
├── screens/                  # UI screens
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── home_screen.dart
│   └── job_detail_screen.dart
├── widgets/                  # Reusable UI components
│   ├── job_card.dart
│   ├── stats_card.dart
│   ├── checklist_item_widget.dart
│   └── job_timer_widget.dart
└── utils/
    └── app_theme.dart        # App theming and colors
```

## Setup Instructions

### Prerequisites
- Flutter SDK (3.0 or later)
- Dart SDK (3.0 or later)
- Android Studio / Xcode for device deployment
- Git

### Installation

1. **Clone the repository**
   ```bash
   cd /app/cleaner_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint**
   - The app is configured to connect to: `https://maid-booking-system.preview.emergentagent.com/api`
   - Update `baseUrl` in `lib/services/api_service.dart` if needed

4. **Run the app**
   
   For Android:
   ```bash
   flutter run -d android
   ```
   
   For iOS:
   ```bash
   flutter run -d ios
   ```

### Building for Production

**Android APK:**
```bash
flutter build apk --release
```

**Android App Bundle:**
```bash
flutter build appbundle --release
```

**iOS:**
```bash
flutter build ios --release
```

## Demo Credentials

For testing purposes, use these demo credentials:

- **Email**: `cleaner@maids.com`
- **Password**: `cleaner123`

*Note: These are demo credentials. In a production environment, cleaners would be provided with individual login credentials by the admin.*

## API Integration

The app integrates with the Maids of Cyfair backend system:

- **Authentication**: JWT-based authentication
- **Job Management**: Real-time job updates
- **Customer Data**: Access to customer information
- **Status Updates**: Bi-directional status synchronization

### Required Backend Setup

1. Create cleaner accounts in the admin dashboard
2. Assign jobs to cleaners
3. Ensure API endpoints are accessible

## Permissions

### Android
- Internet access
- Location services
- Camera access
- Phone call permissions
- Storage access

### iOS
- Location services
- Camera access
- Photo library access
- Network access

## Key Features Breakdown

### Dashboard
- **Today's Jobs**: Jobs scheduled for current date
- **All Jobs**: Complete job history with filtering
- **Profile**: Cleaner statistics and account management

### Job Detail Screen
- **Details Tab**: Customer info, job specifics, ETA updates
- **Checklist Tab**: Interactive task completion
- **Timer Tab**: Time tracking and work summary

### Job Status Flow
1. **Pending** → Job assigned by admin
2. **Confirmed** → Job acknowledged by cleaner
3. **In Progress** → Cleaner has started work
4. **Completed** → All tasks finished and time tracked

## Customization

### Theming
- Colors defined in `lib/utils/app_theme.dart`
- Material Design 3 components
- Custom color scheme for brand consistency

### Checklist Templates
- Dynamic checklist generation based on job type
- Customizable task lists in `job_service.dart`
- Support for required vs optional tasks

## Troubleshooting

### Common Issues

1. **Login fails**: Ensure cleaner account exists in admin dashboard
2. **No jobs displayed**: Check if jobs are assigned to the cleaner
3. **API connection issues**: Verify network connectivity and API endpoint
4. **Permission errors**: Ensure all required permissions are granted

### Debug Mode
- Enable debug logging in `api_service.dart`
- Use Flutter Inspector for UI debugging
- Check device logs for detailed error information

## Production Considerations

1. **Security**: Implement certificate pinning for API calls
2. **Offline Mode**: Add local database for offline job access
3. **Push Notifications**: Implement Firebase for job notifications
4. **Error Handling**: Enhanced error reporting and recovery
5. **Performance**: Optimize image loading and caching
6. **Analytics**: Add crash reporting and usage analytics

## Support

For technical support or feature requests:
- Contact the development team
- Review API documentation
- Check admin dashboard for cleaner account issues

---

**Version**: 1.0.0  
**Last Updated**: August 2025  
**Minimum Requirements**: iOS 12.0+, Android 21+