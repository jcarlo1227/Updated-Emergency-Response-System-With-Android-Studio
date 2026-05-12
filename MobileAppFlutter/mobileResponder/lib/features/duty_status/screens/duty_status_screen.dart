import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/duty_provider.dart';
import '../../location_sharing/service/location_service.dart';

class DutyStatusScreen extends ConsumerStatefulWidget {
  const DutyStatusScreen({super.key});
  @override
  ConsumerState<DutyStatusScreen> createState() => _DutyStatusScreenState();
}

class _DutyStatusScreenState extends ConsumerState<DutyStatusScreen> {
  Position? _position;
  bool _locating = false;
  DateTime? _dutyStart;

  @override
  void initState() {
    super.initState();
    _getPosition();
  }

  Future<void> _getPosition() async {
    setState(() => _locating = true);
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
      setState(() => _position = pos);
    } finally {
      setState(() => _locating = false);
    }
  }

  void _toggleDuty(bool isOnDuty) {
    ref.read(dutyProvider.notifier).toggle();
    if (!isOnDuty) {
      setState(() => _dutyStart = DateTime.now());
      ref.read(locationServiceProvider).startBroadcast();
    } else {
      setState(() => _dutyStart = null);
      ref.read(locationServiceProvider).stopBroadcast();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOnDuty = ref.watch(dutyProvider);
    final responder = ref.watch(currentResponderProvider);
    final color = isOnDuty ? AppColors.successGreen : AppColors.textMuted;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Duty Status'),
        actions: [
          IconButton(icon: const Icon(Icons.map_outlined, color: Colors.white), onPressed: isOnDuty ? () => context.go('/map') : null),
          IconButton(icon: const Icon(Icons.settings_outlined, color: Colors.white), onPressed: () => context.go('/settings')),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 24),
            Container(
              width: 120, height: 120,
              decoration: BoxDecoration(
                color: isOnDuty ? const Color(0xFFDCFCE7) : AppColors.background,
                shape: BoxShape.circle,
                border: Border.all(color: color, width: 3),
              ),
              child: Icon(Icons.local_police, color: color, size: 56),
            ),
            const SizedBox(height: 20),
            Text(
              isOnDuty ? 'ON DUTY' : 'OFF DUTY',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: color),
            ),
            if (isOnDuty && _dutyStart != null) ...[
              const SizedBox(height: 4),
              Text('Since ${_dutyStart!.hour.toString().padLeft(2,'0')}:${_dutyStart!.minute.toString().padLeft(2,'0')}', style: const TextStyle(fontSize: 14, color: AppColors.textMuted)),
            ],
            const SizedBox(height: 32),
            _StatusRow(
              icon: Icons.person,
              label: 'Responder',
              value: responder?.name ?? '—',
              valueColor: AppColors.textStrong,
            ),
            const SizedBox(height: 12),
            _StatusRow(
              icon: Icons.location_on,
              label: 'GPS Status',
              value: _locating ? 'Locating...' : _position != null ? '${_position!.latitude.toStringAsFixed(4)}, ${_position!.longitude.toStringAsFixed(4)}' : 'No GPS — check permissions',
              valueColor: _position != null ? AppColors.successGreen : AppColors.warningAmber,
            ),
            if (responder?.stationName != null) ...[
              const SizedBox(height: 12),
              _StatusRow(icon: Icons.business, label: 'Station', value: responder!.stationName!, valueColor: AppColors.textStrong),
            ],
            const Spacer(),
            SizedBox(
              height: 60,
              child: ElevatedButton(
                onPressed: () => _toggleDuty(isOnDuty),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isOnDuty ? AppColors.alertRed : AppColors.successGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  minimumSize: const Size.fromHeight(60),
                ),
                child: Text(isOnDuty ? 'Go Off Duty' : 'Go On Duty', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              ),
            ),
            if (isOnDuty) ...[
              const SizedBox(height: 12),
              AppButton(label: 'View Emergency Map', onPressed: () => context.go('/map'), icon: Icons.map),
              const SizedBox(height: 8),
              AppOutlinedButton(label: 'My Ambulance Assignments', onPressed: () => context.go('/ambulance')),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color valueColor;
  const _StatusRow({required this.icon, required this.label, required this.value, required this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 20, color: AppColors.textMuted),
      const SizedBox(width: 10),
      Text(label, style: const TextStyle(fontSize: 14, color: AppColors.textMuted)),
      const Spacer(),
      Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: valueColor)),
    ]);
  }
}
