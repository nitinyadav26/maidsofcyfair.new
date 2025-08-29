class Customer {
  final String id;
  final String? userId;
  final String email;
  final String firstName;
  final String lastName;
  final String phone;
  final String address;
  final String city;
  final String state;
  final String zipCode;
  final bool isGuest;
  final DateTime createdAt;

  Customer({
    required this.id,
    this.userId,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.address,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.isGuest,
    required this.createdAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      userId: json['user_id'],
      email: json['email'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      phone: json['phone'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zip_code'],
      isGuest: json['is_guest'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'address': address,
      'city': city,
      'state': state,
      'zip_code': zipCode,
      'is_guest': isGuest,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String get fullName => '$firstName $lastName';
  
  String get displayName => fullName;
  
  String get fullAddress => '$address, $city, $state $zipCode';
}