import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/responder_model.dart';
import '../repository/auth_repository.dart';

sealed class AuthState {}
class AuthLoading extends AuthState {}
class AuthUnauthenticated extends AuthState {}
class AuthPending extends AuthState { final ResponderModel responder; AuthPending(this.responder); }
class AuthAuthenticated extends AuthState { final ResponderModel responder; AuthAuthenticated(this.responder); }
class AuthError extends AuthState { final String message; AuthError(this.message); }

class AuthNotifier extends ChangeNotifier {
  final AuthRepository _repo;
  AuthState _state = AuthLoading();
  AuthNotifier(this._repo);

  AuthState get state => _state;
  void _emit(AuthState next) { _state = next; notifyListeners(); }

  Future<void> initialize() async {
    _emit(AuthLoading());
    try {
      final r = await _repo.restoreSession();
      if (r == null) { _emit(AuthUnauthenticated()); return; }
      if (r.isApproved && r.approvalStatus == 'approved') {
        _emit(AuthAuthenticated(r));
      } else {
        _emit(AuthPending(r));
      }
    } catch (_) { _emit(AuthUnauthenticated()); }
  }

  Future<void> login({required String email, required String password, bool rememberMe = false}) async {
    _emit(AuthLoading());
    try {
      final result = await _repo.login(email: email, password: password, rememberMe: rememberMe);
      final r = result.responder;
      if (r.isApproved && r.approvalStatus == 'approved') {
        _emit(AuthAuthenticated(r));
      } else {
        _emit(AuthPending(r));
      }
    } on Exception catch (e) { _emit(AuthError(e.toString())); rethrow; }
  }

  Future<void> logout() async { await _repo.logout(); _emit(AuthUnauthenticated()); }

  ResponderModel? get currentResponder {
    final s = _state;
    if (s is AuthAuthenticated) return s.responder;
    if (s is AuthPending) return s.responder;
    return null;
  }
}

final authProvider = ChangeNotifierProvider<AuthNotifier>((ref) {
  final n = AuthNotifier(ref.read(authRepositoryProvider));
  n.initialize();
  return n;
});

final authStateProvider = Provider<AuthState>((ref) => ref.watch(authProvider).state);
final currentResponderProvider = Provider<ResponderModel?>((ref) => ref.watch(authProvider).currentResponder);
