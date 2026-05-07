class EmergencyModel {
  final String id;
  final String type;
  final String source;
  final String priority;
  final String status;
  final bool isInsideTanza;
  final bool outsideScopeFlag;
  final String? barangay;
  final String? notes;
  final DateTime createdAt;
  final String? assignedResponderId;

  const EmergencyModel({
    required this.id,
    required this.type,
    required this.source,
    required this.priority,
    required this.status,
    required this.isInsideTanza,
    required this.outsideScopeFlag,
    this.barangay,
    this.notes,
    required this.createdAt,
    this.assignedResponderId,
  });

  factory EmergencyModel.fromJson(Map<String, dynamic> json) {
    return EmergencyModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      source: json['source'] as String? ?? 'mobile_app',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'pending',
      isInsideTanza: json['isInsideTanza'] as bool? ?? true,
      outsideScopeFlag: json['outsideScopeFlag'] as bool? ?? false,
      barangay: json['barangay'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      assignedResponderId: json['assignedResponderId'] as String?,
    );
  }

  bool get isActive => !['resolved', 'cancelled'].contains(status);
  bool get canCancel => status == 'pending';

  String get displayType => switch (type) {
    'medical' => 'Medical Emergency',
    'crime' => 'Crime / Security',
    'fire' => 'Fire',
    'general_sos' => 'General SOS',
    _ => type,
  };
}
