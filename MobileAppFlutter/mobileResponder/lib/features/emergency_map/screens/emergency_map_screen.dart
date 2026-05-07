import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../../core/config/app_config.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/status_badge.dart';
import '../models/emergency_model.dart';
import '../providers/emergency_provider.dart';
import '../repository/emergency_repository.dart';

class EmergencyMapScreen extends ConsumerStatefulWidget {
  const EmergencyMapScreen({super.key});
  @override
  ConsumerState<EmergencyMapScreen> createState() => _EmergencyMapScreenState();
}

class _EmergencyMapScreenState extends ConsumerState<EmergencyMapScreen> {
  LatLng? _myLocation;
  String? _typeFilter;
  io.Socket? _socket;
  bool _loading = true;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _loadFeed();
    await _getLocation();
    await _connectSocket();
  }

  Future<void> _loadFeed() async {
    setState(() => _loading = true);
    await ref.read(emergencyFeedProvider.notifier).refresh(type: _typeFilter);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _getLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => _myLocation = LatLng(pos.latitude, pos.longitude));
    } catch (_) {}
  }

  Future<void> _connectSocket() async {
    final token = await ref.read(secureStorageProvider).getAccessToken();
    _socket = io.io(
      AppConfig.apiBaseUrl.replaceAll('/api', ''),
      io.OptionBuilder().setTransports(['websocket']).setAuth({'token': token}).build(),
    );
    _socket!.on('emergency.created', (data) {
      try {
        final em = EmergencyModel.fromJson(data as Map<String, dynamic>);
        ref.read(emergencyFeedProvider.notifier).upsert(em);
      } catch (_) {}
    });
    _socket!.on('emergency.updated', (data) {
      try {
        final em = EmergencyModel.fromJson(data as Map<String, dynamic>);
        if (!em.isActive) {
          ref.read(emergencyFeedProvider.notifier).remove(em.id);
        } else {
          ref.read(emergencyFeedProvider.notifier).upsert(em);
        }
      } catch (_) {}
    });
  }

  @override
  void dispose() { _socket?.disconnect(); super.dispose(); }

  Color _typeColor(String type) => switch (type) {
    'medical' => AppColors.alertRed,
    'crime' => const Color(0xFF7C3AED),
    'fire' => const Color(0xFFEA580C),
    _ => AppColors.adminNavy,
  };

  IconData _typeIcon(String type) => switch (type) {
    'medical' => Icons.medical_services,
    'crime' => Icons.local_police,
    'fire' => Icons.local_fire_department,
    _ => Icons.sos,
  };

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(emergencyFeedProvider);
    final criticals = feed.where((e) => e.isCritical).length;

    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Emergency Feed'),
          Text('${feed.length} active${criticals > 0 ? ' • $criticals critical' : ''}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400)),
        ]),
        actions: [
          IconButton(icon: const Icon(Icons.airport_shuttle_outlined, color: Colors.white), onPressed: () => context.go('/ambulance')),
          IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _loadFeed),
          IconButton(icon: const Icon(Icons.settings_outlined, color: Colors.white), onPressed: () => context.go('/settings')),
        ],
      ),
      body: Column(
        children: [
          _FilterBar(
            selected: _typeFilter,
            onSelected: (t) { setState(() => _typeFilter = t); _loadFeed(); },
          ),
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _myLocation ?? LatLng(AppConfig.tanzaCenterLat, AppConfig.tanzaCenterLng),
                    initialZoom: 13,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.safealert.app',
                    ),
                    MarkerLayer(markers: [
                      if (_myLocation != null)
                        Marker(point: _myLocation!, child: const Icon(Icons.local_police, color: AppColors.responderBlue, size: 32)),
                      ...feed.map((em) => Marker(
                        point: LatLng(em.lat, em.lng),
                        child: GestureDetector(
                          onTap: () => _showDetail(context, em),
                          child: Container(
                            decoration: BoxDecoration(color: _typeColor(em.type), shape: BoxShape.circle),
                            padding: const EdgeInsets.all(6),
                            child: Icon(_typeIcon(em.type), color: Colors.white, size: 18),
                          ),
                        ),
                      )),
                    ]),
                  ],
                ),
                if (_loading) const Center(child: CircularProgressIndicator()),
              ],
            ),
          ),
          if (feed.isNotEmpty)
            SizedBox(
              height: 130,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(12),
                itemCount: feed.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (_, i) => _EmergencyCard(emergency: feed[i], onTap: () => _showDetail(context, feed[i])),
              ),
            ),
        ],
      ),
    );
  }

  void _showDetail(BuildContext context, EmergencyModel em) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _EmergencyDetailSheet(emergency: em, ref: ref),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final String? selected;
  final void Function(String?) onSelected;
  const _FilterBar({required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          for (final (label, type) in [('All', null), ('Medical', 'medical'), ('Crime', 'crime'), ('Fire', 'fire'), ('SOS', 'general_sos')])
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(label),
                selected: selected == type,
                onSelected: (_) => onSelected(type),
                selectedColor: AppColors.softBlue,
                checkmarkColor: AppColors.responderBlue,
              ),
            ),
        ],
      ),
    );
  }
}

class _EmergencyCard extends StatelessWidget {
  final EmergencyModel emergency;
  final VoidCallback onTap;
  const _EmergencyCard({required this.emergency, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: emergency.isCritical ? AppColors.softRed : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: emergency.isCritical ? AppColors.alertRed : AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text(emergency.displayType, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const Spacer(),
              StatusBadge.priority(emergency.priority),
            ]),
            const SizedBox(height: 4),
            Text(emergency.barangay ?? 'Tanza', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            if (emergency.isIoT) ...[
              const SizedBox(height: 4),
              const Row(children: [
                Icon(Icons.sensors, size: 12, color: AppColors.responderBlue),
                SizedBox(width: 4),
                Text('IoT Keychain', style: TextStyle(fontSize: 11, color: AppColors.responderBlue)),
              ]),
            ],
            const SizedBox(height: 4),
            StatusBadge.fromStatus(emergency.status),
          ],
        ),
      ),
    );
  }
}

class _EmergencyDetailSheet extends StatelessWidget {
  final EmergencyModel emergency;
  final WidgetRef ref;
  const _EmergencyDetailSheet({required this.emergency, required this.ref});

  @override
  Widget build(BuildContext context) {
    final snap = emergency.userSnapshot;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      builder: (_, ctrl) => ListView(
        controller: ctrl,
        padding: const EdgeInsets.all(20),
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: Text(emergency.displayType, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
            StatusBadge.priority(emergency.priority),
          ]),
          const SizedBox(height: 4),
          Row(children: [
            StatusBadge.fromStatus(emergency.status),
            const SizedBox(width: 8),
            if (emergency.isIoT) const StatusBadge(label: 'IoT KEYCHAIN', backgroundColor: AppColors.softBlue, textColor: AppColors.responderBlue),
          ]),
          if (emergency.outsideScopeFlag) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(8)),
              child: const Text('⚠ Outside Tanza Municipality scope', style: TextStyle(fontSize: 12, color: AppColors.warningAmber, fontWeight: FontWeight.w600)),
            ),
          ],
          const SizedBox(height: 16),
          if (snap != null) ...[
            const Divider(),
            _DetailRow('Name', snap['fullName'] as String? ?? '—'),
            if (snap['age'] != null) _DetailRow('Age', '${snap['age']}'),
            if (snap['bloodType'] != null) _DetailRow('Blood type', snap['bloodType'] as String),
            if (snap['emergencyContactName'] != null) _DetailRow('Emergency contact', '${snap['emergencyContactName']} · ${snap['emergencyContactNumber'] ?? ''}'),
          ],
          const Divider(),
          _DetailRow('Location', '${emergency.lat.toStringAsFixed(5)}, ${emergency.lng.toStringAsFixed(5)}${emergency.accuracyMeters != null ? ' (±${emergency.accuracyMeters!.toStringAsFixed(0)}m)' : ''}'),
          if (emergency.barangay != null) _DetailRow('Barangay', emergency.barangay!),
          if (emergency.isIoT) ...[
            if (emergency.sourceDeviceId != null) _DetailRow('Device ID', emergency.sourceDeviceId!),
            if (emergency.deviceBatteryAtTrigger != null) _DetailRow('Battery at trigger', '${emergency.deviceBatteryAtTrigger}%'),
          ],
          if (emergency.notes != null) _DetailRow('Notes', emergency.notes!),
          _DetailRow('Reported', '${emergency.createdAt.hour.toString().padLeft(2,'0')}:${emergency.createdAt.minute.toString().padLeft(2,'0')} · ${emergency.createdAt.day}/${emergency.createdAt.month}/${emergency.createdAt.year}'),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: ElevatedButton.icon(
                icon: const Icon(Icons.navigation),
                label: const Text('Route to scene'),
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/route', extra: {'lat': emergency.lat, 'lng': emergency.lng, 'label': '${emergency.displayType} emergency'});
                },
              ),
            ),
            const SizedBox(width: 12),
            if (emergency.status == 'assigned' && emergency.assignedResponderId != null)
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.successGreen),
                  onPressed: () async {
                    Navigator.pop(context);
                    try {
                      await ref.read(emergencyRepositoryProvider).markOnTheWay(emergency.id);
                      ref.read(emergencyFeedProvider.notifier).refresh();
                    } catch (_) {}
                  },
                  child: const Text('On the way'),
                ),
              ),
          ]),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            icon: const Icon(Icons.report_outlined),
            label: const Text('Submit field report'),
            onPressed: () { Navigator.pop(context); context.push('/map/report/${emergency.id}'); },
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 130, child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textMuted))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
      ]),
    );
  }
}
