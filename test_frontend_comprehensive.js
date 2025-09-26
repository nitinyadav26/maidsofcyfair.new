/**
 * Comprehensive Frontend Testing for Maids of Cyfair
 * This script tests all frontend components and functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MaidsFrontendTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.authToken = null;
    }

    async logTest(testName, success, message = '', screenshot = null) {
        const result = {
            testName,
            success,
            message,
            timestamp: new Date().toISOString(),
            screenshot
        };
        this.testResults.push(result);
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}: ${message}`);
    }

    async takeScreenshot(name) {
        if (this.page) {
            const screenshotPath = `screenshots/${name}_${Date.now()}.png`;
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            return screenshotPath;
        }
        return null;
    }

    async setup() {
        console.log('🚀 Setting up browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser Error:', msg.text());
            }
        });

        // Set up error handling
        this.page.on('pageerror', error => {
            console.log('Page Error:', error.message);
        });
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async navigateTo(url) {
        try {
            await this.page.goto(url, { waitUntil: 'networkidle2' });
            return true;
        } catch (error) {
            console.log(`Navigation failed: ${error.message}`);
            return false;
        }
    }

    async testLandingPage() {
        console.log('\n🏠 Testing Landing Page...');
        
        try {
            const success = await this.navigateTo(this.baseUrl);
            if (!success) {
                await this.logTest('Landing Page Navigation', false, 'Failed to navigate to landing page');
                return;
            }

            // Check if page loads
            const title = await this.page.title();
            await this.logTest('Landing Page Load', true, `Page title: ${title}`);

            // Check for key elements
            const bookingButton = await this.page.$('button:contains("Book Now")');
            if (bookingButton) {
                await this.logTest('Booking Button Present', true, 'Booking button found');
            } else {
                await this.logTest('Booking Button Present', false, 'Booking button not found');
            }

            // Take screenshot
            const screenshot = await this.takeScreenshot('landing_page');
            await this.logTest('Landing Page Screenshot', true, 'Screenshot captured', screenshot);

        } catch (error) {
            await this.logTest('Landing Page Test', false, `Error: ${error.message}`);
        }
    }

    async testAuthentication() {
        console.log('\n🔐 Testing Authentication...');
        
        try {
            // Test registration
            await this.navigateTo(`${this.baseUrl}/register`);
            
            // Fill registration form
            await this.page.type('input[name="email"]', `testuser${Date.now()}@example.com`);
            await this.page.type('input[name="password"]', 'testpassword123');
            await this.page.type('input[name="confirmPassword"]', 'testpassword123');
            await this.page.type('input[name="firstName"]', 'Test');
            await this.page.type('input[name="lastName"]', 'User');
            await this.page.type('input[name="phone"]', '(555) 123-4567');
            
            // Submit form
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(2000);
            
            // Check for success or error
            const errorMessage = await this.page.$('.error-message');
            if (errorMessage) {
                const errorText = await this.page.evaluate(el => el.textContent, errorMessage);
                await this.logTest('User Registration', false, `Registration failed: ${errorText}`);
            } else {
                await this.logTest('User Registration', true, 'Registration form submitted successfully');
            }

            // Test login
            await this.navigateTo(`${this.baseUrl}/login`);
            
            await this.page.type('input[name="email"]', 'test@maids.com');
            await this.page.type('input[name="password"]', 'test@maids@1234');
            
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(2000);
            
            // Check if redirected to dashboard
            const currentUrl = this.page.url();
            if (currentUrl.includes('/dashboard')) {
                await this.logTest('User Login', true, 'Successfully logged in and redirected to dashboard');
            } else {
                await this.logTest('User Login', false, 'Login failed or no redirect to dashboard');
            }

        } catch (error) {
            await this.logTest('Authentication Test', false, `Error: ${error.message}`);
        }
    }

    async testBookingFlow() {
        console.log('\n📅 Testing Booking Flow...');
        
        try {
            // Navigate to booking page
            await this.navigateTo(`${this.baseUrl}/book`);
            
            // Test house size selection
            const houseSizeSelect = await this.page.$('select[name="houseSize"]');
            if (houseSizeSelect) {
                await this.page.select('select[name="houseSize"]', '2000-2500');
                await this.logTest('House Size Selection', true, 'House size selected');
            } else {
                await this.logTest('House Size Selection', false, 'House size selector not found');
            }

            // Test frequency selection
            const frequencySelect = await this.page.$('select[name="frequency"]');
            if (frequencySelect) {
                await this.page.select('select[name="frequency"]', 'monthly');
                await this.logTest('Frequency Selection', true, 'Frequency selected');
            } else {
                await this.logTest('Frequency Selection', false, 'Frequency selector not found');
            }

            // Test service selection
            const serviceCheckboxes = await this.page.$$('input[type="checkbox"][name="services"]');
            if (serviceCheckboxes.length > 0) {
                await serviceCheckboxes[0].click();
                await this.logTest('Service Selection', true, 'Service selected');
            } else {
                await this.logTest('Service Selection', false, 'No service checkboxes found');
            }

            // Test date selection
            const dateInput = await this.page.$('input[type="date"]');
            if (dateInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateString = tomorrow.toISOString().split('T')[0];
                await this.page.type('input[type="date"]', dateString);
                await this.logTest('Date Selection', true, `Date selected: ${dateString}`);
            } else {
                await this.logTest('Date Selection', false, 'Date input not found');
            }

            // Test time slot selection
            const timeSlots = await this.page.$$('input[type="radio"][name="timeSlot"]');
            if (timeSlots.length > 0) {
                await timeSlots[0].click();
                await this.logTest('Time Slot Selection', true, 'Time slot selected');
            } else {
                await this.logTest('Time Slot Selection', false, 'No time slots available');
            }

            // Test address input
            const addressInputs = await this.page.$$('input[name*="address"], input[name*="street"]');
            if (addressInputs.length > 0) {
                await this.page.type('input[name*="address"], input[name*="street"]', '123 Test Street');
                await this.logTest('Address Input', true, 'Address entered');
            } else {
                await this.logTest('Address Input', false, 'Address input not found');
            }

            // Test special instructions
            const instructionsTextarea = await this.page.$('textarea[name*="instructions"]');
            if (instructionsTextarea) {
                await this.page.type('textarea[name*="instructions"]', 'Test special instructions');
                await this.logTest('Special Instructions', true, 'Instructions entered');
            } else {
                await this.logTest('Special Instructions', false, 'Instructions textarea not found');
            }

            // Take screenshot of booking form
            const screenshot = await this.takeScreenshot('booking_form');
            await this.logTest('Booking Form Screenshot', true, 'Screenshot captured', screenshot);

        } catch (error) {
            await this.logTest('Booking Flow Test', false, `Error: ${error.message}`);
        }
    }

    async testAdminDashboard() {
        console.log('\n👑 Testing Admin Dashboard...');
        
        try {
            // Navigate to admin login
            await this.navigateTo(`${this.baseUrl}/admin/login`);
            
            // Login as admin
            await this.page.type('input[name="email"]', 'admin@maids.com');
            await this.page.type('input[name="password"]', 'admin123');
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(2000);
            
            // Check if redirected to admin dashboard
            const currentUrl = this.page.url();
            if (currentUrl.includes('/admin/dashboard')) {
                await this.logTest('Admin Login', true, 'Successfully logged in as admin');
                
                // Test dashboard elements
                const statsCards = await this.page.$$('.stats-card, .metric-card');
                if (statsCards.length > 0) {
                    await this.logTest('Admin Stats Display', true, `Found ${statsCards.length} stats cards`);
                } else {
                    await this.logTest('Admin Stats Display', false, 'No stats cards found');
                }

                // Test navigation menu
                const navItems = await this.page.$$('nav a, .nav-item');
                if (navItems.length > 0) {
                    await this.logTest('Admin Navigation', true, `Found ${navItems.length} navigation items`);
                } else {
                    await this.logTest('Admin Navigation', false, 'No navigation items found');
                }

                // Test bookings table
                const bookingsTable = await this.page.$('table, .bookings-table');
                if (bookingsTable) {
                    await this.logTest('Bookings Table', true, 'Bookings table found');
                } else {
                    await this.logTest('Bookings Table', false, 'Bookings table not found');
                }

                // Take screenshot of admin dashboard
                const screenshot = await this.takeScreenshot('admin_dashboard');
                await this.logTest('Admin Dashboard Screenshot', true, 'Screenshot captured', screenshot);

            } else {
                await this.logTest('Admin Login', false, 'Failed to login as admin or no redirect to dashboard');
            }

        } catch (error) {
            await this.logTest('Admin Dashboard Test', false, `Error: ${error.message}`);
        }
    }

    async testCustomerDashboard() {
        console.log('\n👤 Testing Customer Dashboard...');
        
        try {
            // Navigate to customer dashboard (assuming user is logged in)
            await this.navigateTo(`${this.baseUrl}/dashboard`);
            
            // Check for dashboard elements
            const dashboardTitle = await this.page.$('h1, .dashboard-title');
            if (dashboardTitle) {
                const titleText = await this.page.evaluate(el => el.textContent, dashboardTitle);
                await this.logTest('Customer Dashboard Load', true, `Dashboard loaded: ${titleText}`);
            } else {
                await this.logTest('Customer Dashboard Load', false, 'Dashboard title not found');
            }

            // Test booking history
            const bookingHistory = await this.page.$('.booking-history, .bookings-list');
            if (bookingHistory) {
                await this.logTest('Booking History', true, 'Booking history section found');
            } else {
                await this.logTest('Booking History', false, 'Booking history section not found');
            }

            // Test navigation menu
            const navItems = await this.page.$$('nav a, .nav-item');
            if (navItems.length > 0) {
                await this.logTest('Customer Navigation', true, `Found ${navItems.length} navigation items`);
            } else {
                await this.logTest('Customer Navigation', false, 'No navigation items found');
            }

            // Take screenshot of customer dashboard
            const screenshot = await this.takeScreenshot('customer_dashboard');
            await this.logTest('Customer Dashboard Screenshot', true, 'Screenshot captured', screenshot);

        } catch (error) {
            await this.logTest('Customer Dashboard Test', false, `Error: ${error.message}`);
        }
    }

    async testResponsiveDesign() {
        console.log('\n📱 Testing Responsive Design...');
        
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await this.navigateTo(this.baseUrl);
            
            const mobileScreenshot = await this.takeScreenshot('mobile_view');
            await this.logTest('Mobile View', true, 'Mobile viewport tested', mobileScreenshot);

            // Test tablet viewport
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.navigateTo(this.baseUrl);
            
            const tabletScreenshot = await this.takeScreenshot('tablet_view');
            await this.logTest('Tablet View', true, 'Tablet viewport tested', tabletScreenshot);

            // Test desktop viewport
            await this.page.setViewport({ width: 1280, height: 720 });
            await this.navigateTo(this.baseUrl);
            
            const desktopScreenshot = await this.takeScreenshot('desktop_view');
            await this.logTest('Desktop View', true, 'Desktop viewport tested', desktopScreenshot);

        } catch (error) {
            await this.logTest('Responsive Design Test', false, `Error: ${error.message}`);
        }
    }

    async testFormValidation() {
        console.log('\n✅ Testing Form Validation...');
        
        try {
            // Test registration form validation
            await this.navigateTo(`${this.baseUrl}/register`);
            
            // Try to submit empty form
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(1000);
            
            // Check for validation errors
            const validationErrors = await this.page.$$('.error-message, .validation-error');
            if (validationErrors.length > 0) {
                await this.logTest('Form Validation', true, `Found ${validationErrors.length} validation errors`);
            } else {
                await this.logTest('Form Validation', false, 'No validation errors found for empty form');
            }

            // Test email validation
            await this.page.type('input[name="email"]', 'invalid-email');
            await this.page.type('input[name="password"]', 'test123');
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(1000);
            
            const emailValidation = await this.page.$('.error-message:contains("email")');
            if (emailValidation) {
                await this.logTest('Email Validation', true, 'Email validation working');
            } else {
                await this.logTest('Email Validation', false, 'Email validation not working');
            }

        } catch (error) {
            await this.logTest('Form Validation Test', false, `Error: ${error.message}`);
        }
    }

    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...');
        
        try {
            // Test 404 page
            await this.navigateTo(`${this.baseUrl}/nonexistent-page`);
            const currentUrl = this.page.url();
            if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
                await this.logTest('404 Error Handling', true, '404 page displayed correctly');
            } else {
                await this.logTest('404 Error Handling', false, '404 page not handled correctly');
            }

            // Test network error handling (simulate offline)
            await this.page.setOfflineMode(true);
            await this.navigateTo(this.baseUrl);
            
            const offlineMessage = await this.page.$('.offline-message, .network-error');
            if (offlineMessage) {
                await this.logTest('Offline Handling', true, 'Offline message displayed');
            } else {
                await this.logTest('Offline Handling', false, 'No offline message found');
            }

            // Restore online mode
            await this.page.setOfflineMode(false);

        } catch (error) {
            await this.logTest('Error Handling Test', false, `Error: ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Frontend Testing...');
        console.log(`Testing against: ${this.baseUrl}`);
        
        const startTime = Date.now();
        
        try {
            await this.setup();
            
            // Create screenshots directory
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots');
            }
            
            // Run all test suites
            await this.testLandingPage();
            await this.testAuthentication();
            await this.testBookingFlow();
            await this.testAdminDashboard();
            await this.testCustomerDashboard();
            await this.testResponsiveDesign();
            await this.testFormValidation();
            await this.testErrorHandling();
            
        } catch (error) {
            console.error('Test setup failed:', error);
        } finally {
            await this.teardown();
        }
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        // Generate summary
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`\n📋 Test Summary:`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
        
        // Save detailed results
        const resultsFile = `frontend_test_results_${Date.now()}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify({
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate: (passedTests/totalTests)*100,
                duration
            },
            testResults: this.testResults
        }, null, 2));
        
        console.log(`Detailed results saved to: ${resultsFile}`);
        
        return passedTests === totalTests;
    }
}

// Main execution
async function main() {
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    const tester = new MaidsFrontendTester(baseUrl);
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MaidsFrontendTester;
