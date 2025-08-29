import 'package:flutter/material.dart';
import 'api_service.dart';
import '../models/job.dart';

class JobService extends ChangeNotifier {
  final ApiService _apiService;
  
  List<Job> _jobs = [];
  Job? _selectedJob;
  bool _isLoading = false;
  String? _errorMessage;
  
  JobService(this._apiService);
  
  // Getters
  List<Job> get jobs => _jobs;
  List<Job> get todaysJobs {
    final today = DateTime.now();
    return _jobs.where((job) {
      final jobDate = DateTime.parse(job.bookingDate);
      return jobDate.year == today.year &&
             jobDate.month == today.month &&
             jobDate.day == today.day;
    }).toList();
  }
  
  List<Job> get upcomingJobs {
    final now = DateTime.now();
    return _jobs.where((job) {
      final jobDateTime = job.jobDateTime;
      return jobDateTime.isAfter(now);
    }).toList();
  }
  
  List<Job> get completedJobs {
    return _jobs.where((job) => job.isCompleted).toList();
  }
  
  Job? get selectedJob => _selectedJob;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  
  // Load jobs for cleaner
  Future<void> loadJobs(String cleanerId) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _apiService.getCleanerJobs(cleanerId);
      
      if (result['success']) {
        final jobsData = result['data'] as List;
        _jobs = jobsData.map((jobJson) => Job.fromJson(jobJson)).toList();
        
        // Sort jobs by date and time
        _jobs.sort((a, b) => a.jobDateTime.compareTo(b.jobDateTime));
        
        // Initialize default checklists for jobs
        for (var job in _jobs) {
          if (job.checklist == null) {
            job.checklist = _generateDefaultChecklist(job);
          }
        }
        
        notifyListeners();
      } else {
        _setError(result['error']);
      }
    } catch (e) {
      _setError('Failed to load jobs: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }
  
  // Update job status
  Future<bool> updateJobStatus(String jobId, String status) async {
    try {
      final result = await _apiService.updateJobStatus(jobId, status);
      
      if (result['success']) {
        // Update local job status
        final jobIndex = _jobs.indexWhere((job) => job.id == jobId);
        if (jobIndex != -1) {
          final updatedJob = Job.fromJson({
            ..._jobs[jobIndex].toJson(),
            'status': status,
            'updated_at': DateTime.now().toIso8601String(),
          });
          _jobs[jobIndex] = updatedJob;
          
          if (_selectedJob?.id == jobId) {
            _selectedJob = updatedJob;
          }
          
          notifyListeners();
        }
        return true;
      } else {
        _setError(result['error']);
        return false;
      }
    } catch (e) {
      _setError('Failed to update job status: ${e.toString()}');
      return false;
    }
  }
  
  // Clock in/out methods
  void clockIn(String jobId) {
    final jobIndex = _jobs.indexWhere((job) => job.id == jobId);
    if (jobIndex != -1) {
      _jobs[jobIndex].clockInTime = DateTime.now();
      
      if (_selectedJob?.id == jobId) {
        _selectedJob!.clockInTime = DateTime.now();
      }
      
      // Auto-update status to in_progress when clocking in
      updateJobStatus(jobId, 'in_progress');
      
      notifyListeners();
    }
  }
  
  void clockOut(String jobId) {
    final jobIndex = _jobs.indexWhere((job) => job.id == jobId);
    if (jobIndex != -1) {
      _jobs[jobIndex].clockOutTime = DateTime.now();
      
      if (_selectedJob?.id == jobId) {
        _selectedJob!.clockOutTime = DateTime.now();
      }
      
      notifyListeners();
    }
  }
  
  // ETA update
  void updateETA(String jobId, String eta) {
    final jobIndex = _jobs.indexWhere((job) => job.id == jobId);
    if (jobIndex != -1) {
      _jobs[jobIndex].eta = eta;
      
      if (_selectedJob?.id == jobId) {
        _selectedJob!.eta = eta;
      }
      
      notifyListeners();
    }
  }
  
  // Checklist management
  void updateChecklistItem(String jobId, String itemId, bool isCompleted) {
    final jobIndex = _jobs.indexWhere((job) => job.id == jobId);
    if (jobIndex != -1 && _jobs[jobIndex].checklist != null) {
      final itemIndex = _jobs[jobIndex].checklist!
          .indexWhere((item) => item.id == itemId);
      
      if (itemIndex != -1) {
        if (isCompleted) {
          _jobs[jobIndex].checklist![itemIndex].markCompleted();
        } else {
          _jobs[jobIndex].checklist![itemIndex].markIncomplete();
        }
        
        // Update progress
        _updateJobProgress(jobId);
        
        if (_selectedJob?.id == jobId) {
          _selectedJob = _jobs[jobIndex];
        }
        
        notifyListeners();
      }
    }
  }
  
  // Generate default checklist based on job type
  List<JobChecklistItem> _generateDefaultChecklist(Job job) {
    List<JobChecklistItem> checklist = [
      JobChecklistItem(
        id: 'arrival',
        title: 'Arrival & Setup',
        description: 'Arrive at location, greet customer, set up equipment',
      ),
      JobChecklistItem(
        id: 'dust_surfaces',
        title: 'Dust All Surfaces',
        description: 'Dust furniture, shelves, decorative items, and electronics',
      ),
      JobChecklistItem(
        id: 'vacuum_floors',
        title: 'Vacuum & Mop Floors',
        description: 'Vacuum carpets and rugs, mop hard floors',
      ),
      JobChecklistItem(
        id: 'clean_bathrooms',
        title: 'Clean Bathrooms',
        description: 'Clean toilets, showers, sinks, mirrors, and floors',
      ),
      JobChecklistItem(
        id: 'clean_kitchen',
        title: 'Clean Kitchen',
        description: 'Clean counters, appliances, sink, and floors',
      ),
      JobChecklistItem(
        id: 'empty_trash',
        title: 'Empty Trash',
        description: 'Empty all trash bins and replace liners',
      ),
      JobChecklistItem(
        id: 'final_inspection',
        title: 'Final Inspection',
        description: 'Walk through with customer, address any concerns',
      ),
    ];
    
    // Add specific items for deep cleaning
    if (job.frequency == 'one_time') {
      checklist.addAll([
        JobChecklistItem(
          id: 'deep_baseboards',
          title: 'Clean Baseboards',
          description: 'Detailed cleaning of all baseboards',
        ),
        JobChecklistItem(
          id: 'light_fixtures',
          title: 'Clean Light Fixtures',
          description: 'Clean ceiling fans and light fixtures',
        ),
        JobChecklistItem(
          id: 'windows_interior',
          title: 'Clean Interior Windows',
          description: 'Clean interior windows and sills',
        ),
      ]);
    }
    
    // Add a la carte items to checklist
    for (var service in job.aLaCarteServices) {
      checklist.add(JobChecklistItem(
        id: 'alacarte_${service.serviceId}',
        title: 'A La Carte Service',
        description: 'Complete requested additional service',
      ));
    }
    
    return checklist;
  }
  
  // Update job progress based on checklist completion
  void _updateJobProgress(String jobId) {
    final jobIndex = _jobs.indexWhere((job) => job.id == jobId);
    if (jobIndex != -1 && _jobs[jobIndex].checklist != null) {
      final checklist = _jobs[jobIndex].checklist!;
      final completedItems = checklist.where((item) => item.isCompleted).length;
      final totalItems = checklist.length;
      final percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0.0;
      
      final currentTask = checklist.firstWhere(
        (item) => !item.isCompleted,
        orElse: () => checklist.last,
      ).title;
      
      _jobs[jobIndex].progress = JobProgress(
        jobId: jobId,
        completionPercentage: percentage,
        currentTask: currentTask,
        lastUpdated: DateTime.now(),
      );
    }
  }
  
  // Select a job for detailed view
  void selectJob(Job job) {
    _selectedJob = job;
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
  }
  
  void clearError() {
    _clearError();
    notifyListeners();
  }
  
  // Get job by ID
  Job? getJobById(String jobId) {
    try {
      return _jobs.firstWhere((job) => job.id == jobId);
    } catch (e) {
      return null;
    }
  }
}