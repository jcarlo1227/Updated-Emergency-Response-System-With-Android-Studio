import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/networking/api_exception.dart';
import '../models/emergency_model.dart';

final emergencyRepositoryProvider = Provider<EmergencyRepository>((ref) => EmergencyRepository(ref.read(dioProvider)));

class EmergencyRepository {
  final Dio _dio;
  EmergencyRepository(this._dio);

  Future<List<EmergencyModel>> getActive({String? type}) async {
    try {
      final response = await _dio.get('/emergencies/active', queryParameters: {if (type != null) 'type': type});
      final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final items = data['items'] as List? ?? [];
      return items.map((e) => EmergencyModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }

  Future<EmergencyModel> getOne(String id) async {
    try {
      final response = await _dio.get('/emergencies/$id');
      return EmergencyModel.fromJson((response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }

  Future<EmergencyModel> markOnTheWay(String id) async {
    try {
      final response = await _dio.post('/emergencies/$id/on-the-way', data: {});
      return EmergencyModel.fromJson((response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }

  Future<EmergencyModel> claimEmergency(String id) async {
    try {
      final response = await _dio.post('/emergencies/$id/assign', data: {});
      return EmergencyModel.fromJson((response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }

  Future<void> submitReport(String id, String note) async {
    try {
      await _dio.post('/emergencies/$id/report', data: {'note': note});
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }
}
