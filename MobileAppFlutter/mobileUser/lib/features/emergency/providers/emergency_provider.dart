import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../models/emergency_model.dart';
import '../repository/emergency_repository.dart';
import '../../../core/networking/api_exception.dart';

sealed class EmergencyState {}
class EmergencyIdle extends EmergencyState {}
class EmergencyCreating extends EmergencyState {}
class EmergencyActive extends EmergencyState {
  final EmergencyModel emergency;
  EmergencyActive(this.emergency);
}
class EmergencyError extends EmergencyState {
  final String message;
  EmergencyError(this.message);
}

class EmergencyNotifier extends StateNotifier<EmergencyState> {
  final EmergencyRepository _repo;
  EmergencyNotifier(this._repo) : super(EmergencyIdle());

  Future<EmergencyModel?> createEmergency({
    required String type,
    required Position location,
    String? barangay,
    String? notes,
  }) async {
    state = EmergencyCreating();
    try {
      final em = await _repo.createEmergency(
        type: type,
        location: location,
        barangay: barangay,
        notes: notes,
      );
      state = EmergencyActive(em);
      return em;
    } on ApiException catch (e) {
      state = EmergencyError(e.message);
      return null;
    } catch (_) {
      state = EmergencyError('Failed to send emergency. Check your connection.');
      return null;
    }
  }

  Future<EmergencyModel?> createFromIot({
    required String deviceId,
    required String eventId,
    required String buttonType,
    required Position location,
    int? deviceBattery,
    String? barangay,
  }) async {
    state = EmergencyCreating();
    try {
      final em = await _repo.createFromIot(
        deviceId: deviceId,
        eventId: eventId,
        buttonType: buttonType,
        location: location,
        deviceBattery: deviceBattery,
        barangay: barangay,
      );
      state = EmergencyActive(em);
      return em;
    } catch (_) {
      state = EmergencyError('Failed to send IoT emergency.');
      return null;
    }
  }

  void setActive(EmergencyModel em) => state = EmergencyActive(em);
  void reset() => state = EmergencyIdle();
}

final emergencyProvider = StateNotifierProvider<EmergencyNotifier, EmergencyState>(
  (ref) => EmergencyNotifier(ref.read(emergencyRepositoryProvider)),
);

final myEmergenciesProvider = FutureProvider<List<EmergencyModel>>((ref) {
  return ref.read(emergencyRepositoryProvider).getMyEmergencies();
});
