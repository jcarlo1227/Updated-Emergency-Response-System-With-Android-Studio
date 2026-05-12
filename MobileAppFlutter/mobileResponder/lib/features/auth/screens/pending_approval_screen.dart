import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
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
                decoration: const BoxDecoration(color: Color(0xFFFEF3C7), shape: BoxShape.circle),
                child: const Icon(Icons.hourglass_top, color: AppColors.warningAmber, size: 44),
              ),
              const SizedBox(height: 24),
              const Text('Pending Approval', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              const Text(
                'Your responder credentials are under review by Tanza MDRRMO admin. You will be notified when approved.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppColors.textMuted, height: 1.5),
              ),
              const SizedBox(height: 40),
              const _TimelineStep(icon: Icons.check_circle, label: 'Submitted', done: true),
              _Connector(),
              const _TimelineStep(icon: Icons.manage_search, label: 'Credentials under review', current: true),
              _Connector(),
              const _TimelineStep(icon: Icons.verified_user, label: 'Approved — Access granted'),
              const Spacer(),
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
  final bool done;
  final bool current;
  const _TimelineStep({required this.icon, required this.label, this.done = false, this.current = false});

  @override
  Widget build(BuildContext context) {
    final color = done ? AppColors.successGreen : current ? AppColors.warningAmber : AppColors.border;
    return Row(children: [
      Icon(icon, color: color, size: 24),
      const SizedBox(width: 12),
      Text(label, style: TextStyle(fontSize: 14, fontWeight: done || current ? FontWeight.w600 : FontWeight.w400, color: done || current ? AppColors.textStrong : AppColors.textMuted)),
    ]);
  }
}

class _Connector extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(margin: const EdgeInsets.only(left: 11), width: 2, height: 20, color: AppColors.border);
}
