import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((_) => SecureStorageService());

class SecureStorageService {
  final _storage = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));

  static const _kAccess = 'access_token';
  static const _kRefresh = 'refresh_token';
  static const _kRemember = 'remember_me';
  static const _kUser = 'user_json';

  Future<void> saveTokens({required String accessToken, required String refreshToken}) =>
      Future.wait([_storage.write(key: _kAccess, value: accessToken), _storage.write(key: _kRefresh, value: refreshToken)]);

  Future<String?> getAccessToken() => _storage.read(key: _kAccess);
  Future<String?> getRefreshToken() => _storage.read(key: _kRefresh);
  Future<void> clearTokens() => Future.wait([_storage.delete(key: _kAccess), _storage.delete(key: _kRefresh), _storage.delete(key: _kUser)]);
  Future<void> setRememberMe(bool v) => _storage.write(key: _kRemember, value: v.toString());
  Future<bool> getRememberMe() async => (await _storage.read(key: _kRemember)) == 'true';
  Future<void> saveUserJson(String json) => _storage.write(key: _kUser, value: json);
  Future<String?> getUserJson() => _storage.read(key: _kUser);
}
