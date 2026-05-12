import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/config/app_config.dart';
import '../../../core/networking/api_client.dart';

final locationServiceProvider = Provider<LocationService>((ref) => LocationService(ref.read(dioProvider)));

class LocationService {
  final Dio _dio;
  StreamSubscription<Position>? _sub;
  Timer? _periodicTimer;
  Position? _lastPosition;
  String? _activeEmergencyId;
  String? _activeAmbulanceRequestId;

  LocationService(this._dio);

  void startBroadcast({String? emergencyId, String? ambulanceRequestId}) {
    _sub?.cancel();
    _periodicTimer?.cancel();
    _lastPosition = null;
    _activeEmergencyId = emergencyId;
    _activeAmbulanceRequestId = ambulanceRequestId;

    // Periodic 5-second broadcast for stationary responders (PRD requirement).
    _periodicTimer = Timer.periodic(
      Duration(seconds: AppConfig.locationBroadcastIntervalSec),
      (_) {
        if (_lastPosition != null) {
          _broadcast(_lastPosition!);
        }
      },
    );

    _sub = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: AppConfig.locationBroadcastDistanceMeters.toInt(),
      ),
    ).listen((pos) {
      _lastPosition = pos;
      _broadcast(pos);
    });
  }

  Future<void> _broadcast(Position pos) async {
    try {
      await _dio.post('/locations/responder', data: {
        'coordinates': [pos.longitude, pos.latitude],
        'accuracyMeters': pos.accuracy,
        'capturedAt': DateTime.now().toUtc().toIso8601String(),
        if (_activeEmergencyId != null) 'emergencyId': _activeEmergencyId,
        if (_activeAmbulanceRequestId != null) 'ambulanceRequestId': _activeAmbulanceRequestId,
      });
    } catch (_) {}
  }

  void stopBroadcast() {
    _sub?.cancel();
    _sub = null;
    _periodicTimer?.cancel();
    _periodicTimer = null;
    _lastPosition = null;
    _activeEmergencyId = null;
    _activeAmbulanceRequestId = null;
  }

  void dispose() => stopBroadcast();
}
