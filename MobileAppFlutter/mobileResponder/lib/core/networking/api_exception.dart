class ApiException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;

  const ApiException({required this.message, this.code, this.statusCode});

  factory ApiException.fromMap(Map<String, dynamic> map, int? statusCode) {
    final error = map['error'] as Map<String, dynamic>?;
    return ApiException(
      message: error?['message'] as String? ?? 'An error occurred',
      code: error?['code'] as String?,
      statusCode: statusCode,
    );
  }

  bool get isNotApproved => code == 'ACCOUNT_NOT_APPROVED';

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}
