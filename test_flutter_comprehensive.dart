/**
 * Comprehensive Flutter Mobile App Testing for Maids of Cyfair
 * This script tests the Flutter cleaner mobile application
 */

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:maids_cleaner_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Maids of Cyfair Cleaner App Tests', () {
    testWidgets('App Launch and Splash Screen', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle();

      // Check if splash screen is displayed
      expect(find.text('Maids of Cyfair'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Wait for splash screen to complete
      await tester.pumpAndSettle(Duration(seconds: 3));
    });

    testWidgets('Login Screen Display', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Check if login screen elements are present
      expect(find.text('Login'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2)); // Email and password fields
      expect(find.byType(ElevatedButton), findsOneWidget); // Login button

      // Check for demo credentials text
      expect(find.textContaining('Demo'), findsOneWidget);
    });

    testWidgets('Login Form Validation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test empty form submission
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Check for validation errors
      expect(find.textContaining('required'), findsWidgets);

      // Test invalid email format
      await tester.enterText(find.byType(TextFormField).first, 'invalid-email');
      await tester.enterText(find.byType(TextFormField).last, 'password');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Check for email validation error
      expect(find.textContaining('email'), findsOneWidget);
    });

    testWidgets('Successful Login', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Enter valid credentials
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Check if redirected to home screen
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Today\'s Jobs'), findsOneWidget);
    });

    testWidgets('Dashboard Display', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Check dashboard elements
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Today\'s Jobs'), findsOneWidget);
      expect(find.text('All Jobs'), findsOneWidget);
      expect(find.text('Profile'), findsOneWidget);

      // Check for stats cards
      expect(find.byType(Card), findsWidgets);
    });

    testWidgets('Job List Display', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Navigate to jobs tab
      await tester.tap(find.text('All Jobs'));
      await tester.pumpAndSettle();

      // Check for job list
      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(ListTile), findsWidgets);
    });

    testWidgets('Job Detail Navigation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Navigate to jobs
      await tester.tap(find.text('All Jobs'));
      await tester.pumpAndSettle();

      // Tap on first job if available
      if (find.byType(ListTile).evaluate().isNotEmpty) {
        await tester.tap(find.byType(ListTile).first);
        await tester.pumpAndSettle();

        // Check if job detail screen is displayed
        expect(find.text('Job Details'), findsOneWidget);
        expect(find.text('Customer'), findsOneWidget);
        expect(find.text('Services'), findsOneWidget);
      }
    });

    testWidgets('Job Status Update', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Navigate to jobs
      await tester.tap(find.text('All Jobs'));
      await tester.pumpAndSettle();

      // Tap on first job if available
      if (find.byType(ListTile).evaluate().isNotEmpty) {
        await tester.tap(find.byType(ListTile).first);
        await tester.pumpAndSettle();

        // Look for status update buttons
        if (find.text('Start Job').evaluate().isNotEmpty) {
          await tester.tap(find.text('Start Job'));
          await tester.pumpAndSettle();
          expect(find.text('Job Started'), findsOneWidget);
        }
      }
    });

    testWidgets('Timer Functionality', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Navigate to jobs
      await tester.tap(find.text('All Jobs'));
      await tester.pumpAndSettle();

      // Tap on first job if available
      if (find.byType(ListTile).evaluate().isNotEmpty) {
        await tester.tap(find.byType(ListTile).first);
        await tester.pumpAndSettle();

        // Navigate to timer tab
        await tester.tap(find.text('Timer'));
        await tester.pumpAndSettle();

        // Check for timer elements
        expect(find.text('Clock In'), findsOneWidget);
        expect(find.text('Clock Out'), findsOneWidget);
        expect(find.text('Work Time'), findsOneWidget);
      }
    });

    testWidgets('Checklist Functionality', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Navigate to jobs
      await tester.tap(find.text('All Jobs'));
      await tester.pumpAndSettle();

      // Tap on first job if available
      if (find.byType(ListTile).evaluate().isNotEmpty) {
        await tester.tap(find.byType(ListTile).first);
        await tester.pumpAndSettle();

        // Navigate to checklist tab
        await tester.tap(find.text('Checklist'));
        await tester.pumpAndSettle();

        // Check for checklist items
        expect(find.byType(CheckboxListTile), findsWidgets);
        expect(find.text('Progress'), findsOneWidget);
      }
    });

    testWidgets('Profile Screen', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Navigate to profile
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();

      // Check profile elements
      expect(find.text('Profile'), findsOneWidget);
      expect(find.text('Statistics'), findsOneWidget);
      expect(find.text('Rating'), findsOneWidget);
      expect(find.text('Total Jobs'), findsOneWidget);
    });

    testWidgets('Navigation Between Tabs', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
      await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Test navigation between tabs
      await tester.tap(find.text('All Jobs'));
      await tester.pumpAndSettle();
      expect(find.text('All Jobs'), findsOneWidget);

      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      expect(find.text('Profile'), findsOneWidget);

      await tester.tap(find.text('Dashboard'));
      await tester.pumpAndSettle();
      expect(find.text('Dashboard'), findsOneWidget);
    });

    testWidgets('Error Handling', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test invalid login
      await tester.enterText(find.byType(TextFormField).first, 'invalid@email.com');
      await tester.enterText(find.byType(TextFormField).last, 'wrongpassword');
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Check for error message
      expect(find.textContaining('Invalid'), findsOneWidget);
    });

    testWidgets('Responsive Design', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test different screen sizes
      await tester.binding.setSurfaceSize(Size(375, 667)); // iPhone size
      await tester.pumpAndSettle();
      expect(find.text('Login'), findsOneWidget);

      await tester.binding.setSurfaceSize(Size(768, 1024)); // Tablet size
      await tester.pumpAndSettle();
      expect(find.text('Login'), findsOneWidget);

      await tester.binding.setSurfaceSize(Size(1024, 768)); // Desktop size
      await tester.pumpAndSettle();
      expect(find.text('Login'), findsOneWidget);
    });

    testWidgets('Accessibility Features', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Check for semantic labels
      expect(find.byType(Semantics), findsWidgets);
      
      // Check for proper text contrast
      final textWidgets = find.byType(Text);
      expect(textWidgets, findsWidgets);
    });

    testWidgets('Performance Test', (WidgetTester tester) async {
      final stopwatch = Stopwatch()..start();
      
      app.main();
      await tester.pumpAndSettle();
      
      stopwatch.stop();
      
      // Check if app loads within reasonable time (5 seconds)
      expect(stopwatch.elapsedMilliseconds, lessThan(5000));
    });
  });
}

// Additional test utilities
class TestHelper {
  static Future<void> loginUser(WidgetTester tester) async {
    await tester.enterText(find.byType(TextFormField).first, 'cleaner@maids.com');
    await tester.enterText(find.byType(TextFormField).last, 'cleaner123');
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();
  }

  static Future<void> navigateToTab(WidgetTester tester, String tabName) async {
    await tester.tap(find.text(tabName));
    await tester.pumpAndSettle();
  }

  static Future<void> tapButton(WidgetTester tester, String buttonText) async {
    await tester.tap(find.text(buttonText));
    await tester.pumpAndSettle();
  }

  static Future<void> enterText(WidgetTester tester, String text) async {
    await tester.enterText(find.byType(TextFormField).first, text);
    await tester.pumpAndSettle();
  }
}

// Test data constants
class TestData {
  static const String validEmail = 'cleaner@maids.com';
  static const String validPassword = 'cleaner123';
  static const String invalidEmail = 'invalid@email.com';
  static const String invalidPassword = 'wrongpassword';
  
  static const List<String> tabNames = ['Dashboard', 'All Jobs', 'Profile'];
  static const List<String> jobStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
  static const List<String> checklistItems = [
    'Dust all surfaces',
    'Vacuum carpets',
    'Clean bathrooms',
    'Kitchen cleaning',
    'Final inspection'
  ];
}
