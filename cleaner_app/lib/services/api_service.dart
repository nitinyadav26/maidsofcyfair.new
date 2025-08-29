import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://maid-booking-system.preview.emergentagent.com/api';
  
  String? _authToken;
  
  // Auth Token Management
  String? get authToken => _authToken;
  
  void setAuthToken(String token) {
    _authToken = token;
  }
  
  Future<void> saveToken(String token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
  
  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
  }
  
  Future<void> clearToken() async {
    _authToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }
  
  // HTTP Headers
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    
    return headers;
  }
  
  // API Methods
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await saveToken(data['access_token']);
        return {'success': true, 'data': data};
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'error': error['detail'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
  
  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to get user info'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
  
  Future<Map<String, dynamic>> getCleanerJobs(String cleanerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/bookings'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        final allBookings = jsonDecode(response.body) as List;
        final cleanerJobs = allBookings
            .where((booking) => booking['cleaner_id'] == cleanerId)
            .toList();
        return {'success': true, 'data': cleanerJobs};
      } else {
        return {'success': false, 'error': 'Failed to load jobs'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
  
  Future<Map<String, dynamic>> updateJobStatus(String jobId, String status) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/admin/bookings/$jobId'),
        headers: _headers,
        body: jsonEncode({'status': status}),
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to update job status'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
  
  Future<Map<String, dynamic>> getCustomerDetails(String customerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/customers/$customerId'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to load customer details'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
  
  // Create cleaner account (this should be called by admin)
  Future<Map<String, dynamic>> createCleanerAccount(Map<String, dynamic> cleanerData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/cleaners'),
        headers: _headers,
        body: jsonEncode(cleanerData),
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to create cleaner account'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
  
  Future<Map<String, dynamic>> getAllCleaners() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/cleaners'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to load cleaners'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
}