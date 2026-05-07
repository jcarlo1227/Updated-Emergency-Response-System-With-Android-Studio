import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/networking/api_exception.dart';
import '../models/emergency_model.dart';

final emergencyRepositoryProvider = Provider<EmergencyRepository>(
  (ref) => EmergencyRepository(ref.read(dioProvider)),
);

class EmergencyRepository {
  final Dio _dio;
  EmergencyRepository(this._dio);

  Future<EmergencyModel> createEmergency({
    required String type,
    required Position location,
    String? barangay,
    String? notes,
  }) async {
    try {
      final response = await _dio.post('/emergencies', data: {
        'type': type,
        'source': 'mobile_app',
        'location': {
          'type': 'Point',
          'coordinates': [location.longitude, location.latitude],
          'accuracyMeters': location.accuracy,
          'capturedAt': DateTime.now().toUtc().toIso8601String(),
        },
        if (barangay != null) 'barangay': barangay,
        if (notes != null) 'notes': notes,
      });
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      return EmergencyModel.fromJson(data);
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<EmergencyModel> createFromIot({
    required String deviceId,
    required String eventId,
    required String buttonType,
    required Position location,
    int? deviceBattery,
    String? barangay,
  }) async {
    try {
      final response = await _dio.post('/emergencies/from-iot', data: {
        'deviceId': deviceId,
        'eventId': eventId,
        'buttonType': buttonType,
        if (deviceBattery != null) 'deviceBatteryAtTrigger': deviceBattery,
        'location': {
          'type': 'Point',
          'coordinates': [location.longitude, location.latitude],
          'accuracyMeters': location.accuracy,
          'capturedAt': DateTime.now().toUtc().toIso8601String(),
        },
        if (barangay != null) 'barangay': barangay,
      });
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      return EmergencyModel.fromJson(data);
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<EmergencyModel> getEmergency(String id) async {
    try {
      final response = await _dio.get('/emergencies/$id');
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      return EmergencyModel.fromJson(data);
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<List<EmergencyModel>> getMyEmergencies() async {
    try {
      final response = await _dio.get('/emergencies/my');
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final items = data['items'] as List? ?? [];
      return items.map((e) => EmergencyModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<void> cancelEmergency(String id, {String? reason}) async {
    try {
      await _dio.post('/emergencies/$id/cancel', data: {
        if (reason != null) 'reason': reason,
      });
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<void> sendLocation({
    required Position location,
    String? emergencyId,
  }) async {
    try {
      await _dio.post('/locations/user', data: {
        'coordinates': [location.longitude, location.latitude],
        'accuracyMeters': location.accuracy,
        'capturedAt': DateTime.now().toUtc().toIso8601String(),
        if (emergencyId != null) 'emergencyId': emergencyId,
      });
    } on DioException catch (_) {
      // silently fail location updates
    }
  }
}
