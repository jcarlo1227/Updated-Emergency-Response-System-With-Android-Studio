import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/emergency_model.dart';
import '../repository/emergency_repository.dart';

class EmergencyFeedNotifier extends StateNotifier<List<EmergencyModel>> {
  final EmergencyRepository _repo;
  EmergencyFeedNotifier(this._repo) : super([]);

  Future<void> refresh({String? type}) async {
    final list = await _repo.getActive(type: type);
    state = list;
  }

  void upsert(EmergencyModel em) {
    final idx = state.indexWhere((e) => e.id == em.id);
    if (idx >= 0) {
      state = [...state.sublist(0, idx), em, ...state.sublist(idx + 1)];
    } else {
      state = [em, ...state];
    }
  }

  void remove(String id) {
    state = state.where((e) => e.id != id).toList();
  }
}

final emergencyFeedProvider = StateNotifierProvider<EmergencyFeedNotifier, List<EmergencyModel>>(
  (ref) => EmergencyFeedNotifier(ref.read(emergencyRepositoryProvider)),
);
