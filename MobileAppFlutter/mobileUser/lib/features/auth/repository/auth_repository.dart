import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http_parser/http_parser.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider), ref.read(secureStorageProvider));
});

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthRepository(this._dio, this._storage);

  Future<({UserModel user, String accessToken, String refreshToken})> login({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email.trim().toLowerCase(),
        'password': password,
        'role': 'user',
      });
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(data);
      final access = data['accessToken'] as String;
      final refresh = data['refreshToken'] as String;
      await _storage.saveTokens(accessToken: access, refreshToken: refresh);
      await _storage.setRememberMe(rememberMe);
      await _storage.saveUserJson(jsonEncode(user.toJson()));
      return (user: user, accessToken: access, refreshToken: refresh);
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<UserModel> registerUser({
    required String name,
    required String email,
    required String phone,
    required String password,
    required DateTime dateOfBirth,
    required String bloodType,
    required String streetAddress,
    required String emergencyContactName,
    required String emergencyContactNumber,
    required File faceCapture,
    required File proofOfResidency,
    String? municipality,
    String? barangay,
  }) async {
    try {
      String? mimeFromPath(String path) {
        final lower = path.toLowerCase();
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.heic')) return 'image/heic';
        if (lower.endsWith('.webp')) return 'image/webp';
        return 'image/jpeg';
      }

      MediaType mediaTypeOf(File f) {
        final mt = mimeFromPath(f.path) ?? 'image/jpeg';
        final parts = mt.split('/');
        return MediaType(parts[0], parts[1]);
      }

      final form = FormData.fromMap({
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
        'phone': phone.trim(),
        'password': password,
        'dateOfBirth': dateOfBirth.toUtc().toIso8601String(),
        'bloodType': bloodType,
        'streetAddress': streetAddress.trim(),
        'emergencyContactName': emergencyContactName.trim(),
        'emergencyContactNumber': emergencyContactNumber.trim(),
        if (municipality != null) 'municipality': municipality,
        if (barangay != null) 'barangay': barangay,
        'faceCapture': await MultipartFile.fromFile(
          faceCapture.path,
          filename: faceCapture.path.split(Platform.pathSeparator).last,
          contentType: mediaTypeOf(faceCapture),
        ),
        'proofOfResidency': await MultipartFile.fromFile(
          proofOfResidency.path,
          filename: proofOfResidency.path.split(Platform.pathSeparator).last,
          contentType: mediaTypeOf(proofOfResidency),
        ),
      });

      final response = await _dio.post(
        '/auth/register/user',
        data: form,
        options: Options(contentType: 'multipart/form-data'),
      );
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      return UserModel.fromJson(data);
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<UserModel> getMe() async {
    try {
      final response = await _dio.get('/auth/me');
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(data);
      await _storage.saveUserJson(jsonEncode(user.toJson()));
      return user;
    } on DioException catch (e) {
      throw dioErrorToApiException(e);
    }
  }

  Future<void> logout() async {
    try {
      final refresh = await _storage.getRefreshToken();
      if (refresh != null) {
        await _dio.post('/auth/logout', data: {'refreshToken': refresh});
      }
    } finally {
      await _storage.clearTokens();
    }
  }

  Future<UserModel?> restoreSession() async {
    final token = await _storage.getAccessToken();
    if (token == null) return null;
    final remember = await _storage.getRememberMe();
    if (!remember) {
      await _storage.clearTokens();
      return null;
    }
    try {
      return await getMe();
    } catch (_) {
      final cached = await _storage.getUserJson();
      if (cached != null) {
        return UserModel.fromJson(jsonDecode(cached) as Map<String, dynamic>);
      }
      return null;
    }
  }
}
