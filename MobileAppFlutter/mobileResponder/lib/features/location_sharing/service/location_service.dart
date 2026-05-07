import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/networking/api_client.dart';

final locationServiceProvider = Provider<LocationService>((ref) => LocationService(ref.read(dioProvider)));

class LocationService {
  final Dio _dio;
  StreamSubscription<Position>? _sub;

  LocationService(this._dio);

  void startBroadcast({String? emergencyId, String? ambulanceRequestId}) {
    _sub?.cancel();
    _sub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((pos) async {
      try {
        await _dio.post('/locations/responder', data: {
          'coordinates': [pos.longitude, pos.latitude],
          'accuracyMeters': pos.accuracy,
          'capturedAt': DateTime.now().toUtc().toIso8601String(),
          if (emergencyId != null) 'emergencyId': emergencyId,
          if (ambulanceRequestId != null) 'ambulanceRequestId': ambulanceRequestId,
        });
      } catch (_) {}
    });
  }

  void stopBroadcast() {
    _sub?.cancel();
    _sub = null;
  }

  void dispose() => stopBroadcast();
}
