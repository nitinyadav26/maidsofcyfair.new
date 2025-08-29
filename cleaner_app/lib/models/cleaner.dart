class Cleaner {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String phone;
  final bool isActive;
  final double rating;
  final int totalJobs;
  final DateTime createdAt;
  
  Cleaner({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.isActive,
    required this.rating,
    required this.totalJobs,
    required this.createdAt,
  });
  
  factory Cleaner.fromJson(Map<String, dynamic> json) {
    return Cleaner(
      id: json['id'],
      email: json['email'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      phone: json['phone'],
      isActive: json['is_active'] ?? true,
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalJobs: json['total_jobs'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'is_active': isActive,
      'rating': rating,
      'total_jobs': totalJobs,
      'created_at': createdAt.toIso8601String(),
    };
  }
  
  String get fullName => '$firstName $lastName';
  
  String get displayName => fullName;
}