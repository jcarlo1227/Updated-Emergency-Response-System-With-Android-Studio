import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  AppConfig._();

  static String get apiBaseUrl {
    // If you are testing on a physical device, use your computer's local IP address.
    // Replace '192.168.1.10' if your computer's IP address changes.
    const String physicalDeviceIp = '192.168.1.10';

    if (kIsWeb) return 'http://localhost:5000/api';
    try {
      // Return local network IP to support both emulators and physical devices
      return 'http://$physicalDeviceIp:5000/api'; 
    } catch (_) {
      return 'http://127.0.0.1:5000/api';
    }
  }

  static const double tanzaMinLat = 14.30;
  static const double tanzaMaxLat = 14.42;
  static const double tanzaMinLng = 120.82;
  static const double tanzaMaxLng = 120.95;
  static const double tanzaCenterLat = 14.355;
  static const double tanzaCenterLng = 120.885;

  static const int locationBroadcastIntervalSec = 5;
  static const double locationBroadcastDistanceMeters = 10;
  static const int nearArrivalRadiusMeters = 200;

  static bool isInsideTanza(double lat, double lng) =>
      lat >= tanzaMinLat &&
      lat <= tanzaMaxLat &&
      lng >= tanzaMinLng &&
      lng <= tanzaMaxLng;
}
