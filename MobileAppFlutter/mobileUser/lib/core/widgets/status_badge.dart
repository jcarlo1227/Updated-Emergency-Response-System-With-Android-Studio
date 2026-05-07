import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;

  const StatusBadge({
    super.key,
    required this.label,
    this.backgroundColor = AppColors.softBlue,
    this.textColor = AppColors.responderBlue,
  });

  factory StatusBadge.pending() => const StatusBadge(
        label: 'Pending',
        backgroundColor: Color(0xFFFEF3C7),
        textColor: AppColors.warningAmber,
      );

  factory StatusBadge.approved() => const StatusBadge(
        label: 'Approved',
        backgroundColor: Color(0xFFDCFCE7),
        textColor: AppColors.successGreen,
      );

  factory StatusBadge.rejected() => const StatusBadge(
        label: 'Rejected',
        backgroundColor: AppColors.softRed,
        textColor: AppColors.alertRed,
      );

  factory StatusBadge.fromStatus(String status) {
    switch (status) {
      case 'pending':
      case 'pending_review':
        return StatusBadge.pending();
      case 'approved':
        return StatusBadge.approved();
      case 'rejected':
        return StatusBadge.rejected();
      case 'assigned':
        return const StatusBadge(label: 'Assigned', backgroundColor: AppColors.softBlue, textColor: AppColors.responderBlue);
      case 'on_the_way':
      case 'responder_on_the_way':
        return const StatusBadge(label: 'On the way', backgroundColor: AppColors.softBlue, textColor: AppColors.responderBlue);
      case 'completed':
      case 'resolved':
        return StatusBadge.approved();
      case 'cancelled':
        return StatusBadge.rejected();
      default:
        return StatusBadge(label: status, backgroundColor: AppColors.softBlue, textColor: AppColors.responderBlue);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: textColor,
        ),
      ),
    );
  }
}
