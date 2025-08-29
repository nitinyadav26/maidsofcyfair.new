class Job {
  final String id;
  final String? userId;
  final String customerId;
  final String houseSize;
  final String frequency;
  final List<JobService> services;
  final List<JobService> aLaCarteServices;
  final String bookingDate;
  final String timeSlot;
  final double basePrice;
  final double aLaCarteTotal;
  final double totalAmount;
  final String status;
  final String paymentStatus;
  final String? specialInstructions;
  final String? cleanerId;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Additional fields for cleaner app
  JobProgress? progress;
  List<JobChecklistItem>? checklist;
  String? eta;
  DateTime? clockInTime;
  DateTime? clockOutTime;
  
  Job({
    required this.id,
    this.userId,
    required this.customerId,
    required this.houseSize,
    required this.frequency,
    required this.services,
    required this.aLaCarteServices,
    required this.bookingDate,
    required this.timeSlot,
    required this.basePrice,
    required this.aLaCarteTotal,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    this.specialInstructions,
    this.cleanerId,
    required this.createdAt,
    required this.updatedAt,
    this.progress,
    this.checklist,
    this.eta,
    this.clockInTime,
    this.clockOutTime,
  });
  
  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id'],
      userId: json['user_id'],
      customerId: json['customer_id'],
      houseSize: json['house_size'],
      frequency: json['frequency'],
      services: (json['services'] as List)
          .map((service) => JobService.fromJson(service))
          .toList(),
      aLaCarteServices: (json['a_la_carte_services'] as List?)
          ?.map((service) => JobService.fromJson(service))
          .toList() ?? [],
      bookingDate: json['booking_date'],
      timeSlot: json['time_slot'],
      basePrice: (json['base_price'] ?? 0.0).toDouble(),
      aLaCarteTotal: (json['a_la_carte_total'] ?? 0.0).toDouble(),
      totalAmount: (json['total_amount']).toDouble(),
      status: json['status'],
      paymentStatus: json['payment_status'],
      specialInstructions: json['special_instructions'],
      cleanerId: json['cleaner_id'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'customer_id': customerId,
      'house_size': houseSize,
      'frequency': frequency,
      'services': services.map((s) => s.toJson()).toList(),
      'a_la_carte_services': aLaCarteServices.map((s) => s.toJson()).toList(),
      'booking_date': bookingDate,
      'time_slot': timeSlot,
      'base_price': basePrice,
      'a_la_carte_total': aLaCarteTotal,
      'total_amount': totalAmount,
      'status': status,
      'payment_status': paymentStatus,
      'special_instructions': specialInstructions,
      'cleaner_id': cleanerId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  // Helper methods
  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  
  String get statusDisplayName {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.toUpperCase();
    }
  }
  
  DateTime get jobDateTime {
    final date = DateTime.parse(bookingDate);
    final timeParts = timeSlot.split('-')[0].split(':');
    return DateTime(
      date.year,
      date.month,
      date.day,
      int.parse(timeParts[0]),
      int.parse(timeParts[1]),
    );
  }
  
  String get timeSlotStart => timeSlot.split('-')[0];
  String get timeSlotEnd => timeSlot.split('-')[1];
  
  Duration? get workDuration {
    if (clockInTime != null && clockOutTime != null) {
      return clockOutTime!.difference(clockInTime!);
    }
    return null;
  }
}

class JobService {
  final String serviceId;
  final int quantity;
  final String? specialInstructions;
  
  JobService({
    required this.serviceId,
    required this.quantity,
    this.specialInstructions,
  });
  
  factory JobService.fromJson(Map<String, dynamic> json) {
    return JobService(
      serviceId: json['service_id'],
      quantity: json['quantity'],
      specialInstructions: json['special_instructions'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'service_id': serviceId,
      'quantity': quantity,
      'special_instructions': specialInstructions,
    };
  }
}

class JobProgress {
  final String jobId;
  final double completionPercentage;
  final String currentTask;
  final DateTime lastUpdated;
  
  JobProgress({
    required this.jobId,
    required this.completionPercentage,
    required this.currentTask,
    required this.lastUpdated,
  });
  
  factory JobProgress.fromJson(Map<String, dynamic> json) {
    return JobProgress(
      jobId: json['job_id'],
      completionPercentage: (json['completion_percentage']).toDouble(),
      currentTask: json['current_task'],
      lastUpdated: DateTime.parse(json['last_updated']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'job_id': jobId,
      'completion_percentage': completionPercentage,
      'current_task': currentTask,
      'last_updated': lastUpdated.toIso8601String(),
    };
  }
}

class JobChecklistItem {
  final String id;
  final String title;
  final String description;
  bool isCompleted;
  final bool isRequired;
  DateTime? completedAt;
  
  JobChecklistItem({
    required this.id,
    required this.title,
    required this.description,
    this.isCompleted = false,
    this.isRequired = true,
    this.completedAt,
  });
  
  factory JobChecklistItem.fromJson(Map<String, dynamic> json) {
    return JobChecklistItem(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      isCompleted: json['is_completed'] ?? false,
      isRequired: json['is_required'] ?? true,
      completedAt: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at'])
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'is_completed': isCompleted,
      'is_required': isRequired,
      'completed_at': completedAt?.toIso8601String(),
    };
  }
  
  void markCompleted() {
    isCompleted = true;
    completedAt = DateTime.now();
  }
  
  void markIncomplete() {
    isCompleted = false;
    completedAt = null;
  }
}