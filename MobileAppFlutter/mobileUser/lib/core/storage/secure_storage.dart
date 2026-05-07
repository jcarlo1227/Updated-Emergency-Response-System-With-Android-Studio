import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>(
  (_) => SecureStorageService(),
);

class SecureStorageService {
  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyAccessToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyRememberMe = 'remember_me';
  static const _keyUserJson = 'user_json';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _keyAccessToken, value: accessToken),
      _storage.write(key: _keyRefreshToken, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: _keyAccessToken);
  Future<String?> getRefreshToken() => _storage.read(key: _keyRefreshToken);

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _keyAccessToken),
      _storage.delete(key: _keyRefreshToken),
      _storage.delete(key: _keyUserJson),
    ]);
  }

  Future<void> setRememberMe(bool value) =>
      _storage.write(key: _keyRememberMe, value: value.toString());

  Future<bool> getRememberMe() async {
    final val = await _storage.read(key: _keyRememberMe);
    return val == 'true';
  }

  Future<void> saveUserJson(String json) =>
      _storage.write(key: _keyUserJson, value: json);

  Future<String?> getUserJson() => _storage.read(key: _keyUserJson);
}
