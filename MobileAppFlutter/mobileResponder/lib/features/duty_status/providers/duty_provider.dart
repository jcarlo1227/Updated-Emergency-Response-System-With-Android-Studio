import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/networking/api_client.dart';

class DutyNotifier extends StateNotifier<bool> {
  final Dio _dio;
  DutyNotifier(this._dio) : super(false);

  void toggle() {
    final newState = !state;
    state = newState;
    _syncDutyStatus(newState);
  }

  void setOnDuty(bool value) {
    state = value;
    _syncDutyStatus(value);
  }

  Future<void> _syncDutyStatus(bool isOnDuty) async {
    try {
      await _dio.post('/responders/duty', data: {
        'status': isOnDuty ? 'on_duty' : 'off_duty',
      });
    } catch (_) {}
  }
}

final dutyProvider = StateNotifierProvider<DutyNotifier, bool>(
  (ref) => DutyNotifier(ref.read(dioProvider)),
);
