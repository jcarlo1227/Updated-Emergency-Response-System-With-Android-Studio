import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/status_badge.dart';
import '../models/ambulance_request_model.dart';
import '../repository/ambulance_repository.dart';

final _assignedProvider = FutureProvider<List<AmbulanceRequestModel>>((ref) => ref.read(ambulanceRepositoryProvider).getMyAssigned());

class AmbulanceListScreen extends ConsumerWidget {
  const AmbulanceListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_assignedProvider);
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/duty'),
        ),
        title: const Text('Ambulance Assignments'),
        actions: [IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: () => ref.invalidate(_assignedProvider))],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) => list.isEmpty
            ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.airport_shuttle_outlined, size: 48, color: AppColors.textMuted),
                SizedBox(height: 12),
                Text('No active assignments', style: TextStyle(color: AppColors.textMuted)),
              ]))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final req = list[i];
                  return GestureDetector(
                    onTap: () => context.push('/ambulance/${req.id}'),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: req.isEmergencyPriority ? AppColors.softRed : AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: req.isEmergencyPriority ? AppColors.alertRed : AppColors.border, width: req.isEmergencyPriority ? 2 : 1),
                      ),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Icon(Icons.airport_shuttle, color: req.isEmergencyPriority ? AppColors.alertRed : AppColors.responderBlue),
                          const SizedBox(width: 8),
                          Expanded(child: Text(req.displayType, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: req.isEmergencyPriority ? AppColors.alertRed : AppColors.textStrong))),
                          StatusBadge.fromStatus(req.status),
                        ]),
                        const SizedBox(height: 8),
                        Text('Patient: ${req.patient['fullName'] ?? '—'}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                        Text('Pickup: ${req.pickupLocation['addressLabel'] ?? '—'}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        if (req.requestedTime != null) Text('Scheduled: ${req.requestedDate?.substring(0,10) ?? ''} at ${req.requestedTime}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        if (req.isEmergencyPriority) Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.alertRed, borderRadius: BorderRadius.circular(20)),
                          child: const Text('CRITICAL PRIORITY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                        ),
                      ]),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
