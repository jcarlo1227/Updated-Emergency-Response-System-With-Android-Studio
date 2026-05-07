class EmergencyModel {
  final String id;
  final String type;
  final String source;
  final String priority;
  final String status;
  final double lat;
  final double lng;
  final double? accuracyMeters;
  final bool isInsideTanza;
  final bool outsideScopeFlag;
  final String? barangay;
  final String? notes;
  final DateTime createdAt;
  final String? assignedResponderId;
  final Map<String, dynamic>? userSnapshot;
  final String? bleEventId;
  final String? sourceDeviceId;
  final int? deviceBatteryAtTrigger;

  const EmergencyModel({
    required this.id,
    required this.type,
    required this.source,
    required this.priority,
    required this.status,
    required this.lat,
    required this.lng,
    this.accuracyMeters,
    required this.isInsideTanza,
    required this.outsideScopeFlag,
    this.barangay,
    this.notes,
    required this.createdAt,
    this.assignedResponderId,
    this.userSnapshot,
    this.bleEventId,
    this.sourceDeviceId,
    this.deviceBatteryAtTrigger,
  });

  factory EmergencyModel.fromJson(Map<String, dynamic> json) {
    final loc = json['currentLocation'] as Map<String, dynamic>?;
    final coords = loc?['coordinates'] as List?;
    return EmergencyModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      source: json['source'] as String? ?? 'mobile_app',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'pending',
      lat: coords != null && coords.length >= 2 ? (coords[1] as num).toDouble() : 14.355,
      lng: coords != null && coords.isNotEmpty ? (coords[0] as num).toDouble() : 120.885,
      accuracyMeters: loc?['accuracyMeters'] as double?,
      isInsideTanza: json['isInsideTanza'] as bool? ?? true,
      outsideScopeFlag: json['outsideScopeFlag'] as bool? ?? false,
      barangay: json['barangay'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now() : DateTime.now(),
      assignedResponderId: json['assignedResponderId'] as String?,
      userSnapshot: json['userSnapshot'] as Map<String, dynamic>?,
      bleEventId: json['bleEventId'] as String?,
      sourceDeviceId: json['sourceDeviceId'] as String?,
      deviceBatteryAtTrigger: json['deviceBatteryAtTrigger'] as int?,
    );
  }

  bool get isActive => !['resolved', 'cancelled'].contains(status);
  bool get isCritical => priority == 'critical';
  bool get isIoT => source == 'iot_keychain';

  String get displayType => switch (type) {
    'medical' => 'Medical',
    'crime' => 'Crime',
    'fire' => 'Fire',
    'general_sos' => 'SOS',
    _ => type,
  };
}
