class AmbulanceRequestModel {
  final String id;
  final String requestType;
  final String status;
  final Map<String, dynamic> patient;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropOffLocation;
  final Map<String, dynamic>? accompanyingPerson;
  final bool isEmergencyPriority;
  final String? requestedDate;
  final String? requestedTime;
  final String? assignedAmbulanceUnitId;
  final DateTime createdAt;

  const AmbulanceRequestModel({
    required this.id,
    required this.requestType,
    required this.status,
    required this.patient,
    required this.pickupLocation,
    required this.dropOffLocation,
    this.accompanyingPerson,
    required this.isEmergencyPriority,
    this.requestedDate,
    this.requestedTime,
    this.assignedAmbulanceUnitId,
    required this.createdAt,
  });

  factory AmbulanceRequestModel.fromJson(Map<String, dynamic> json) => AmbulanceRequestModel(
        id: json['_id'] as String? ?? '',
        requestType: json['requestType'] as String? ?? 'emergency',
        status: json['status'] as String? ?? 'assigned',
        patient: json['patient'] as Map<String, dynamic>? ?? {},
        pickupLocation: json['pickupLocation'] as Map<String, dynamic>? ?? {},
        dropOffLocation: json['dropOffLocation'] as Map<String, dynamic>? ?? {},
        accompanyingPerson: json['accompanyingPerson'] as Map<String, dynamic>?,
        isEmergencyPriority: json['isEmergencyPriority'] as bool? ?? false,
        requestedDate: json['requestedDate'] as String?,
        requestedTime: json['requestedTime'] as String?,
        assignedAmbulanceUnitId: json['assignedAmbulanceUnitId'] as String?,
        createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now() : DateTime.now(),
      );

  double get pickupLat => ((pickupLocation['coordinates'] as List?)?.getOrNull(1) as num?)?.toDouble() ?? 14.355;
  double get pickupLng => ((pickupLocation['coordinates'] as List?)?.getOrNull(0) as num?)?.toDouble() ?? 120.885;
  double get dropLat => ((dropOffLocation['coordinates'] as List?)?.getOrNull(1) as num?)?.toDouble() ?? 14.38;
  double get dropLng => ((dropOffLocation['coordinates'] as List?)?.getOrNull(0) as num?)?.toDouble() ?? 120.87;

  String get displayType => switch (requestType) {
    'emergency' => 'Emergency Transport',
    'schedule' => 'Scheduled Transport',
    'transfer' => 'Hospital Transfer',
    _ => requestType,
  };
}

extension _ListExt<T> on List<T> {
  T? getOrNull(int i) => i >= 0 && i < length ? this[i] : null;
}
