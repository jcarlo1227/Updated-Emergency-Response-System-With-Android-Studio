class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final bool isApproved;
  final String approvalStatus;
  final String? municipality;
  final String? barangay;
  final String? bloodType;
  final String? emergencyContactName;
  final String? emergencyContactNumber;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.isApproved,
    required this.approvalStatus,
    this.municipality,
    this.barangay,
    this.bloodType,
    this.emergencyContactName,
    this.emergencyContactNumber,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final account = json['account'] as Map<String, dynamic>? ?? json;
    return UserModel(
      id: account['_id'] as String? ?? account['id'] as String? ?? '',
      name: account['name'] as String? ?? '',
      email: account['email'] as String? ?? '',
      phone: account['phone'] as String? ?? '',
      role: account['role'] as String? ?? 'user',
      isApproved: account['isApproved'] as bool? ?? false,
      approvalStatus: account['approvalStatus'] as String? ?? 'pending',
      municipality: account['municipality'] as String?,
      barangay: account['barangay'] as String?,
      bloodType: account['bloodType'] as String?,
      emergencyContactName: account['emergencyContactName'] as String?,
      emergencyContactNumber: account['emergencyContactNumber'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'isApproved': isApproved,
        'approvalStatus': approvalStatus,
        'municipality': municipality,
        'barangay': barangay,
        'bloodType': bloodType,
        'emergencyContactName': emergencyContactName,
        'emergencyContactNumber': emergencyContactNumber,
      };

  bool get isPending => approvalStatus == 'pending';
  bool get isRejected => approvalStatus == 'rejected';
}
