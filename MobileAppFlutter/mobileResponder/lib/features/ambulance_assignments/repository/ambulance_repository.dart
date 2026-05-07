import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/networking/api_exception.dart';
import '../models/ambulance_request_model.dart';

final ambulanceRepositoryProvider = Provider<AmbulanceRepository>((ref) => AmbulanceRepository(ref.read(dioProvider)));

class AmbulanceRepository {
  final Dio _dio;
  AmbulanceRepository(this._dio);

  Future<List<AmbulanceRequestModel>> getMyAssigned() async {
    try {
      final response = await _dio.get('/responder/ambulance-requests');
      final data = (response.data as Map<String, dynamic>)['data'] as List? ?? [];
      return data.map((e) => AmbulanceRequestModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }

  Future<AmbulanceRequestModel> _patch(String id, String action) async {
    try {
      final response = await _dio.post('/responder/ambulance-requests/$id/$action', data: {});
      return AmbulanceRequestModel.fromJson((response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) { throw dioErrorToApiException(e); }
  }

  Future<AmbulanceRequestModel> markOnTheWay(String id) => _patch(id, 'on-the-way');
  Future<AmbulanceRequestModel> markArrivedPickup(String id) => _patch(id, 'arrived-pickup');
  Future<AmbulanceRequestModel> markPatientOnboard(String id) => _patch(id, 'patient-onboard');
  Future<AmbulanceRequestModel> complete(String id) => _patch(id, 'complete');
}
