import 'package:flutter/material.dart';
import 'api_service.dart';
import '../models/cleaner.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService;
  
  Cleaner? _currentCleaner;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _errorMessage;
  
  AuthService(this._apiService);
  
  // Getters
  Cleaner? get currentCleaner => _currentCleaner;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  
  // Initialize auth state
  Future<void> initialize() async {
    _setLoading(true);
    
    await _apiService.loadToken();
    
    if (_apiService.authToken != null) {
      final result = await _apiService.getCurrentUser();
      if (result['success']) {
        final userData = result['data'];
        
        // For demo purposes, we'll find the cleaner by email
        // In production, this should be handled differently
        final cleanersResult = await _apiService.getAllCleaners();
        if (cleanersResult['success']) {
          final cleaners = cleanersResult['data'] as List;
          final cleanerData = cleaners.firstWhere(
            (cleaner) => cleaner['email'] == userData['email'],
            orElse: () => null,
          );
          
          if (cleanerData != null) {
            _currentCleaner = Cleaner.fromJson(cleanerData);
            _isAuthenticated = true;
          }
        }
      }
    }
    
    _setLoading(false);
  }
  
  // Login method
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _apiService.login(email, password);
      
      if (result['success']) {
        final userData = result['data']['user'];
        
        // Check if this user is a cleaner by searching the cleaners database
        final cleanersResult = await _apiService.getAllCleaners();
        if (cleanersResult['success']) {
          final cleaners = cleanersResult['data'] as List;
          final cleanerData = cleaners.firstWhere(
            (cleaner) => cleaner['email'] == userData['email'],
            orElse: () => null,
          );
          
          if (cleanerData != null) {
            _currentCleaner = Cleaner.fromJson(cleanerData);
            _isAuthenticated = true;
            notifyListeners();
            return true;
          } else {
            _setError('Account not found in cleaner database');
            await _apiService.clearToken();
            return false;
          }
        } else {
          _setError('Failed to verify cleaner account');
          return false;
        }
      } else {
        _setError(result['error']);
        return false;
      }
    } catch (e) {
      _setError('Login failed: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }
  
  // Logout method
  Future<void> logout() async {
    _currentCleaner = null;
    _isAuthenticated = false;
    await _apiService.clearToken();
    notifyListeners();
  }
  
  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
  
  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }
  
  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }
  
  void clearError() {
    _clearError();
  }
}