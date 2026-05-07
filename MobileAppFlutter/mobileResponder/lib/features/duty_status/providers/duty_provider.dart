import 'package:flutter_riverpod/flutter_riverpod.dart';

class DutyNotifier extends StateNotifier<bool> {
  DutyNotifier() : super(false);

  void toggle() => state = !state;
  void setOnDuty(bool value) => state = value;
}

final dutyProvider = StateNotifierProvider<DutyNotifier, bool>((_) => DutyNotifier());
