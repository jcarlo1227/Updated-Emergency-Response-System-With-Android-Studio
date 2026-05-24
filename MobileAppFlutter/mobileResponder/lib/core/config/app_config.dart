import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  AppConfig._();

  // Pass at build/run time via --dart-define=API_BASE_URL=https://your-tunnel.trycloudflare.com/api
  // Empty string means: fall back to local LAN defaults (dev on same Wi-Fi).
  static const String _apiBaseUrlOverride =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  // Used only when API_BASE_URL is not provided. Set to your laptop's LAN IP.
  static const String _lanDevIp = '192.168.1.10';

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    if (kIsWeb) return 'http://localhost:5000/api';
    return 'http://$_lanDevIp:5000/api';
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
