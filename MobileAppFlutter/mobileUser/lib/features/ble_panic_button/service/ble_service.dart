import 'dart:async';
import 'dart:convert';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import '../../../core/config/app_config.dart';

enum BleConnectionState { off, scanning, connected, disconnected }

class BleDeviceState {
  final BleConnectionState connection;
  final String? deviceId;
  final String? deviceName;
  final int? batteryPercent;
  final DateTime? lastSeen;
  final String? firmwareVersion;
  final bool switchOn;

  const BleDeviceState({
    this.connection = BleConnectionState.disconnected,
    this.deviceId,
    this.deviceName,
    this.batteryPercent,
    this.lastSeen,
    this.firmwareVersion,
    this.switchOn = false,
  });

  bool get isConnected => connection == BleConnectionState.connected;
  bool get isHeartbeatStale {
    if (lastSeen == null) return false;
    return DateTime.now().difference(lastSeen!) >
        const Duration(seconds: AppConfig.bleHeartbeatTimeoutSec);
  }

  BleDeviceState copyWith({
    BleConnectionState? connection,
    String? deviceId,
    String? deviceName,
    int? batteryPercent,
    DateTime? lastSeen,
    String? firmwareVersion,
    bool? switchOn,
  }) =>
      BleDeviceState(
        connection: connection ?? this.connection,
        deviceId: deviceId ?? this.deviceId,
        deviceName: deviceName ?? this.deviceName,
        batteryPercent: batteryPercent ?? this.batteryPercent,
        lastSeen: lastSeen ?? this.lastSeen,
        firmwareVersion: firmwareVersion ?? this.firmwareVersion,
        switchOn: switchOn ?? this.switchOn,
      );
}

typedef BleEventCallback = void Function(String buttonType, String eventId, int? battery);

class BleService extends StateNotifier<BleDeviceState> {
  BleEventCallback? onButtonPressed;

  final _processedEventIds = <String>{};
  BluetoothDevice? _device;
  StreamSubscription? _connSub;
  StreamSubscription? _notifySub;
  Timer? _heartbeatTimer;
  final Box<String> _offlineQueue;

  BleService(this._offlineQueue) : super(const BleDeviceState());

  Future<void> startScan() async {
    state = state.copyWith(connection: BleConnectionState.scanning);
    await FlutterBluePlus.startScan(
      withServices: [Guid(AppConfig.serviceUuid)],
      timeout: const Duration(seconds: 10),
    );
    FlutterBluePlus.scanResults.listen((results) {
      if (results.isNotEmpty) {
        FlutterBluePlus.stopScan();
        _connectTo(results.first.device);
      }
    });
    Future.delayed(const Duration(seconds: 11), () {
      if (state.connection == BleConnectionState.scanning) {
        state = state.copyWith(connection: BleConnectionState.disconnected);
      }
    });
  }

  void stopScan() {
    FlutterBluePlus.stopScan();
    if (state.connection == BleConnectionState.scanning) {
      state = state.copyWith(connection: BleConnectionState.disconnected);
    }
  }

  Future<void> _connectTo(BluetoothDevice device) async {
    try {
      await device.connect(autoConnect: false);
      _device = device;
      state = state.copyWith(
        connection: BleConnectionState.connected,
        deviceId: device.remoteId.str,
        deviceName: device.platformName,
        lastSeen: DateTime.now(),
      );
      _subscribeToCharacteristics(device);
      _startHeartbeatTimer();

      _connSub = device.connectionState.listen((connState) {
        if (connState == BluetoothConnectionState.disconnected) {
          state = state.copyWith(connection: BleConnectionState.disconnected);
          _heartbeatTimer?.cancel();
        }
      });
    } catch (_) {
      state = state.copyWith(connection: BleConnectionState.disconnected);
    }
  }

  Future<void> _subscribeToCharacteristics(BluetoothDevice device) async {
    final services = await device.discoverServices();
    for (final service in services) {
      if (service.uuid.str.toLowerCase() != AppConfig.serviceUuid.toLowerCase()) continue;
      for (final char in service.characteristics) {
        final uuid = char.uuid.str.toLowerCase();
        if (uuid == AppConfig.buttonCharUuid.toLowerCase()) {
          await char.setNotifyValue(true);
          _notifySub = char.onValueReceived.listen(_handleButtonEvent);
        }
        if (uuid == AppConfig.batteryCharUuid.toLowerCase()) {
          await char.setNotifyValue(true);
          char.onValueReceived.listen((v) {
            if (v.isNotEmpty) {
              state = state.copyWith(batteryPercent: v[0], lastSeen: DateTime.now());
            }
          });
          final val = await char.read();
          if (val.isNotEmpty) state = state.copyWith(batteryPercent: val[0]);
        }
        if (uuid == AppConfig.heartbeatCharUuid.toLowerCase()) {
          await char.setNotifyValue(true);
          char.onValueReceived.listen((_) {
            state = state.copyWith(lastSeen: DateTime.now());
          });
        }
      }
    }
  }

  void _handleButtonEvent(List<int> bytes) {
    try {
      final json = jsonDecode(utf8.decode(bytes)) as Map<String, dynamic>;
      final eventId = json['eventId'] as String? ?? '';
      final buttonType = json['buttonType'] as String? ?? 'general_sos';
      final battery = json['batteryLevel'] as int?;

      if (_processedEventIds.contains(eventId)) return;
      _processedEventIds.add(eventId);
      if (_processedEventIds.length > 200) _processedEventIds.clear();

      state = state.copyWith(batteryPercent: battery ?? state.batteryPercent, lastSeen: DateTime.now());
      onButtonPressed?.call(buttonType, eventId, battery);
    } catch (_) {}
  }

  void _startHeartbeatTimer() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (state.isHeartbeatStale && state.isConnected) {
        state = state.copyWith(connection: BleConnectionState.disconnected);
      }
    });
  }

  void queueOfflineEvent(Map<String, dynamic> event) {
    _offlineQueue.put(
      '${event['deviceId']}_${event['eventId']}',
      jsonEncode(event),
    );
  }

  List<Map<String, dynamic>> drainOfflineQueue() {
    final events = _offlineQueue.values
        .map((v) => jsonDecode(v) as Map<String, dynamic>)
        .toList();
    _offlineQueue.clear();
    return events;
  }

  Future<void> disconnect() async {
    await _device?.disconnect();
    _connSub?.cancel();
    _notifySub?.cancel();
    _heartbeatTimer?.cancel();
    state = const BleDeviceState();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}

final bleServiceProvider = StateNotifierProvider<BleService, BleDeviceState>((ref) {
  final box = Hive.box<String>('offline_queue');
  return BleService(box);
});
