import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  AppConfig._();

  static String get apiBaseUrl {
    // If you are testing on a physical device, use your computer's local IP address.
    // Replace '192.168.1.10' if your computer's IP address changes.
    const String physicalDeviceIp = '192.168.1.10';

    if (kIsWeb) return 'http://localhost:5000/api';
    try {
      // If Android, we first check if it might be a physical device. 
      // Emulators often return false for some physical characteristics, but a safer bet
      // for local dev across emulators AND physical devices is just to use the IP directly.
      // However, to keep it compatible out-of-the-box, we'll return the local IP first.
      
      // return 'http://10.0.2.2:5000/api'; // Uncomment for Emulator ONLY
      return 'http://$physicalDeviceIp:5000/api'; // Works for physical devices AND emulators
    } catch (_) {
      return 'http://127.0.0.1:5000/api';
    }
  }

  static const String serviceUuid = '9f4d0001-7d6a-4b85-9e74-2f4d8e8d0001';
  static const String buttonCharUuid = '9f4d0002-7d6a-4b85-9e74-2f4d8e8d0002';
  static const String batteryCharUuid = '00002a19-0000-1000-8000-00805f9b34fb';
  static const String heartbeatCharUuid = '9f4d0003-7d6a-4b85-9e74-2f4d8e8d0003';

  static const double tanzaMinLat = 14.30;
  static const double tanzaMaxLat = 14.42;
  static const double tanzaMinLng = 120.82;
  static const double tanzaMaxLng = 120.95;
  static const double tanzaCenterLat = 14.355;
  static const double tanzaCenterLng = 120.885;

  static const int bleHeartbeatTimeoutSec = 30;
  static const int locationMaxAgeSec = 60;
  static const int locationHistoryCap = 100;

  static bool isInsideTanza(double lat, double lng) =>
      lat >= tanzaMinLat &&
      lat <= tanzaMaxLat &&
      lng >= tanzaMinLng &&
      lng <= tanzaMaxLng;
}
