import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../providers/auth_provider.dart';

class PendingApprovalScreen extends ConsumerWidget {
  const PendingApprovalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 48),
              Container(
                width: 88, height: 88,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.hourglass_top, color: AppColors.warningAmber, size: 44),
              ),
              const SizedBox(height: 24),
              const Text('Pending Approval', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              const Text(
                'Your account has been submitted for review by the Tanza MDRRMO admin team. You will be notified once approved.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: AppColors.textMuted, height: 1.5),
              ),
              const SizedBox(height: 40),
              _TimelineStep(
                icon: Icons.check_circle,
                label: 'Submitted',
                color: AppColors.successGreen,
                isDone: true,
              ),
              _TimelineConnector(),
              _TimelineStep(
                icon: Icons.manage_search,
                label: 'Under Review',
                color: AppColors.warningAmber,
                isCurrent: true,
              ),
              _TimelineConnector(),
              _TimelineStep(
                icon: Icons.verified_user,
                label: 'Approved — Access Granted',
                color: AppColors.border,
              ),
              const Spacer(),
              AppOutlinedButton(
                label: 'Contact MDRRMO Support',
                onPressed: () async {
                  final uri = Uri.parse('tel:+6346 4222100');
                  if (await canLaunchUrl(uri)) launchUrl(uri);
                },
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => ref.read(authProvider.notifier).logout(),
                child: const Text('Sign out', style: TextStyle(color: AppColors.textMuted)),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isDone;
  final bool isCurrent;

  const _TimelineStep({
    required this.icon,
    required this.label,
    required this.color,
    this.isDone = false,
    this.isCurrent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: isCurrent || isDone ? FontWeight.w600 : FontWeight.w400,
            color: isCurrent || isDone ? AppColors.textStrong : AppColors.textMuted,
          ),
        ),
        if (isCurrent) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text('Current', style: TextStyle(fontSize: 11, color: AppColors.warningAmber, fontWeight: FontWeight.w700)),
          ),
        ],
      ],
    );
  }
}

class _TimelineConnector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 11),
      width: 2,
      height: 24,
      color: AppColors.border,
    );
  }
}
