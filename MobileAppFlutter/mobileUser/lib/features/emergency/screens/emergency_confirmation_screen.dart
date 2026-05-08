import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/emergency_provider.dart';

class EmergencyConfirmationScreen extends ConsumerStatefulWidget {
  final String emergencyType;
  const EmergencyConfirmationScreen({super.key, required this.emergencyType});

  @override
  ConsumerState<EmergencyConfirmationScreen> createState() =>
      _EmergencyConfirmationScreenState();
}

class _EmergencyConfirmationScreenState
    extends ConsumerState<EmergencyConfirmationScreen> {
  Position? _position;
  bool _locating = true;
  String? _locationError;
  bool _sending = false;

  static const _labels = {
    'medical': ('Medical Emergency', Icons.medical_services, AppColors.alertRed),
    'crime': ('Crime / Security', Icons.local_police, Color(0xFF7C3AED)),
    'fire': ('Fire Emergency', Icons.local_fire_department, Color(0xFFEA580C)),
    'general_sos': ('General SOS', Icons.sos, AppColors.adminNavy),
  };

  @override
  void initState() {
    super.initState();
    _acquireLocation();
  }

  Future<void> _acquireLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        setState(() { _locationError = 'Location permission denied. Enable in settings.'; _locating = false; });
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 15)),
      );
      setState(() { _position = pos; _locating = false; });
    } catch (_) {
      try {
        final last = await Geolocator.getLastKnownPosition();
        if (last != null && DateTime.now().difference(last.timestamp) <
            const Duration(seconds: 60)) {
          setState(() { _position = last; _locating = false; });
          return;
        }
      } catch (_) {}
      setState(() { _locationError = 'Could not get GPS. Please try again.'; _locating = false; });
    }
  }

  Future<void> _send() async {
    if (_position == null) { _acquireLocation(); return; }
    setState(() => _sending = true);
    final user = ref.read(currentUserProvider);
    final em = await ref.read(emergencyProvider.notifier).createEmergency(
      type: widget.emergencyType,
      location: _position!,
      barangay: user?.barangay,
    );
    if (!mounted) return;
    setState(() => _sending = false);
    if (em != null) {
      context.go('/home/emergency/${em.id}');
    } else if (ref.read(emergencyProvider) is EmergencyQueued) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No connection — alert saved and will send automatically when online.'),
          duration: Duration(seconds: 4),
        ),
      );
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send emergency. Check your connection.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final typeLabel = _labels[widget.emergencyType]?.$1 ?? 'Emergency';
    final typeIcon = _labels[widget.emergencyType]?.$2 ?? Icons.sos;
    final typeColor = _labels[widget.emergencyType]?.$3 ?? AppColors.alertRed;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Confirm Emergency'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Spacer(),
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(
                color: typeColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(typeIcon, color: typeColor, size: 52),
            ),
            const SizedBox(height: 20),
            Text(typeLabel, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            const Text(
              'Your location, profile and emergency details will be sent to Tanza MDRRMO.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textMuted, height: 1.5),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _InfoRow(
                    icon: Icons.location_on,
                    label: 'GPS Status',
                    value: _locating
                        ? 'Getting location...'
                        : _locationError != null
                            ? _locationError!
                            : 'Lat ${_position!.latitude.toStringAsFixed(5)}, Lng ${_position!.longitude.toStringAsFixed(5)}',
                    color: _locationError != null ? AppColors.alertRed : AppColors.successGreen,
                  ),
                  const Divider(height: 20),
                  _InfoRow(
                    icon: Icons.gps_fixed,
                    label: 'Accuracy',
                    value: _position != null ? '±${_position!.accuracy.toStringAsFixed(0)}m' : '—',
                    color: AppColors.textMuted,
                  ),
                ],
              ),
            ),
            const Spacer(),
            if (_locationError != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.softRed, borderRadius: BorderRadius.circular(8)),
                child: Text(_locationError!, style: const TextStyle(color: AppColors.alertRed, fontSize: 13)),
              ),
            AppButton(
              label: _sending ? 'Sending...' : 'SEND EMERGENCY ALERT',
              onPressed: _sending || _locating ? null : _send,
              isLoading: _sending,
              backgroundColor: typeColor,
            ),
            const SizedBox(height: 12),
            AppOutlinedButton(
              label: 'Cancel',
              onPressed: () => context.pop(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoRow({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}
