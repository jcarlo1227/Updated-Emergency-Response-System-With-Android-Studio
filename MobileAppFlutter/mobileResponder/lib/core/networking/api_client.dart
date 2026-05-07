import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';
import 'api_exception.dart';

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.read(secureStorageProvider);
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await storage.getAccessToken();
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
      handler.next(options);
    },
    onError: (error, handler) async {
      if (error.response?.statusCode == 401) {
        try {
          final refreshToken = await storage.getRefreshToken();
          if (refreshToken == null) { await storage.clearTokens(); return handler.next(error); }
          final response = await Dio().post('${AppConfig.apiBaseUrl}/auth/refresh', data: {'refreshToken': refreshToken});
          final data = response.data as Map<String, dynamic>;
          final newAccess = data['data']['accessToken'] as String;
          final newRefresh = data['data']['refreshToken'] as String;
          await storage.saveTokens(accessToken: newAccess, refreshToken: newRefresh);
          error.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
          final retried = await dio.fetch<dynamic>(error.requestOptions);
          return handler.resolve(retried);
        } catch (_) { await storage.clearTokens(); }
      }
      handler.next(error);
    },
  ));
  return dio;
});

ApiException dioErrorToApiException(DioException e) {
  final data = e.response?.data;
  if (data is Map<String, dynamic>) return ApiException.fromMap(data, e.response?.statusCode);
  return ApiException(message: e.message ?? 'Network error', statusCode: e.response?.statusCode);
}
