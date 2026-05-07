class AssignedAmbulanceUnit {
  final String id;
  final int? unitNumber;
  final String? unitName;
  final String? plateNumber;
  final String? availabilityStatus;

  const AssignedAmbulanceUnit({
    required this.id,
    this.unitNumber,
    this.unitName,
    this.plateNumber,
    this.availabilityStatus,
  });

  factory AssignedAmbulanceUnit.fromJson(Map<String, dynamic> json) =>
      AssignedAmbulanceUnit(
        id: json['_id']?.toString() ?? '',
        unitNumber: json['unitNumber'] as int?,
        unitName: json['unitName'] as String?,
        plateNumber: json['plateNumber'] as String?,
        availabilityStatus: json['availabilityStatus'] as String?,
      );

  String get displayName {
    final parts = <String>[
      if (unitNumber != null) 'Unit $unitNumber',
      if (unitName != null && unitName!.isNotEmpty) unitName!,
    ];
    return parts.isEmpty ? 'Assigned unit' : parts.join(' — ');
  }
}

class AssignedResponder {
  final String id;
  final String? name;
  final String? phone;
  final String? responderRole;
  final String? department;

  const AssignedResponder({
    required this.id,
    this.name,
    this.phone,
    this.responderRole,
    this.department,
  });

  factory AssignedResponder.fromJson(Map<String, dynamic> json) =>
      AssignedResponder(
        id: json['_id']?.toString() ?? '',
        name: json['name'] as String?,
        phone: json['phone'] as String?,
        responderRole: json['responderRole'] as String?,
        department: json['department'] as String?,
      );

  String get roleLabel {
    final r = responderRole ?? department;
    if (r == null || r.isEmpty) return '';
    return r
        .split('_')
        .map((s) => s.isEmpty ? '' : '${s[0].toUpperCase()}${s.substring(1)}')
        .join(' ');
  }
}

class AmbulanceRequestModel {
  final String id;
  final String requestType;
  final String status;
  final Map<String, dynamic> patient;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropOffLocation;
  final bool isEmergencyPriority;
  final bool isTanzaCitizenPriority;
  final bool outsideScopeFlag;
  final String? requestedDate;
  final String? requestedTime;
  final AssignedAmbulanceUnit? assignedUnit;
  final AssignedResponder? assignedResponder;
  final String? rejectionReason;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const AmbulanceRequestModel({
    required this.id,
    required this.requestType,
    required this.status,
    required this.patient,
    required this.pickupLocation,
    required this.dropOffLocation,
    required this.isEmergencyPriority,
    required this.isTanzaCitizenPriority,
    required this.outsideScopeFlag,
    this.requestedDate,
    this.requestedTime,
    this.assignedUnit,
    this.assignedResponder,
    this.rejectionReason,
    required this.createdAt,
    this.updatedAt,
  });

  factory AmbulanceRequestModel.fromJson(Map<String, dynamic> json) {
    AssignedAmbulanceUnit? unit;
    final unitRaw = json['assignedAmbulanceUnitId'];
    if (unitRaw is Map<String, dynamic>) {
      unit = AssignedAmbulanceUnit.fromJson(unitRaw);
    } else if (unitRaw is String && unitRaw.isNotEmpty) {
      unit = AssignedAmbulanceUnit(id: unitRaw);
    }
    AssignedResponder? responder;
    final respRaw = json['assignedResponderId'];
    if (respRaw is Map<String, dynamic>) {
      responder = AssignedResponder.fromJson(respRaw);
    } else if (respRaw is String && respRaw.isNotEmpty) {
      responder = AssignedResponder(id: respRaw);
    }
    return AmbulanceRequestModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      requestType: json['requestType'] as String? ?? 'emergency',
      status: json['status'] as String? ?? 'pending_review',
      patient: json['patient'] as Map<String, dynamic>? ?? {},
      pickupLocation: json['pickupLocation'] as Map<String, dynamic>? ?? {},
      dropOffLocation: json['dropOffLocation'] as Map<String, dynamic>? ?? {},
      isEmergencyPriority: json['isEmergencyPriority'] as bool? ?? false,
      isTanzaCitizenPriority: json['isTanzaCitizenPriority'] as bool? ?? false,
      outsideScopeFlag: json['outsideScopeFlag'] as bool? ?? false,
      requestedDate: json['requestedDate'] as String?,
      requestedTime: json['requestedTime'] as String?,
      assignedUnit: unit,
      assignedResponder: responder,
      rejectionReason: json['rejectionReason'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  String get displayType => switch (requestType) {
        'emergency' => 'Emergency Transport',
        'schedule' => 'Scheduled Transport',
        'transfer' => 'Hospital Transfer',
        _ => requestType,
      };

  bool get isActive => !isClosed;
  bool get isClosed => const ['completed', 'cancelled', 'rejected'].contains(status);
  bool get isRejected => status == 'rejected';
  bool get isCompleted => status == 'completed';

  double? get pickupLat {
    final coords = pickupLocation['coordinates'];
    if (coords is List && coords.length >= 2) {
      return (coords[1] as num?)?.toDouble();
    }
    return null;
  }

  double? get pickupLng {
    final coords = pickupLocation['coordinates'];
    if (coords is List && coords.length >= 2) {
      return (coords[0] as num?)?.toDouble();
    }
    return null;
  }

  double? get dropoffLat {
    final coords = dropOffLocation['coordinates'];
    if (coords is List && coords.length >= 2) {
      return (coords[1] as num?)?.toDouble();
    }
    return null;
  }

  double? get dropoffLng {
    final coords = dropOffLocation['coordinates'];
    if (coords is List && coords.length >= 2) {
      return (coords[0] as num?)?.toDouble();
    }
    return null;
  }

  String get pickupAddress => pickupLocation['addressLabel'] as String? ?? '—';
  String get dropoffAddress => dropOffLocation['addressLabel'] as String? ?? '—';
}
