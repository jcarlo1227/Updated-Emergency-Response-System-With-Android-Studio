import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;

  const StatusBadge({super.key, required this.label, this.backgroundColor = AppColors.softBlue, this.textColor = AppColors.responderBlue});

  factory StatusBadge.priority(String priority) {
    return switch (priority) {
      'critical' => const StatusBadge(label: 'CRITICAL', backgroundColor: AppColors.softRed, textColor: AppColors.alertRed),
      'high' => const StatusBadge(label: 'HIGH', backgroundColor: Color(0xFFFEF3C7), textColor: AppColors.warningAmber),
      _ => const StatusBadge(label: 'MEDIUM'),
    };
  }

  factory StatusBadge.fromStatus(String status) {
    return switch (status) {
      'pending' => const StatusBadge(label: 'PENDING', backgroundColor: Color(0xFFFEF3C7), textColor: AppColors.warningAmber),
      'assigned' => const StatusBadge(label: 'ASSIGNED'),
      'responder_on_the_way' => const StatusBadge(label: 'ON THE WAY', backgroundColor: AppColors.softBlue, textColor: AppColors.responderBlue),
      'resolved' => const StatusBadge(label: 'RESOLVED', backgroundColor: Color(0xFFDCFCE7), textColor: AppColors.successGreen),
      _ => StatusBadge(label: status.toUpperCase()),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: backgroundColor, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textColor)),
    );
  }
}
