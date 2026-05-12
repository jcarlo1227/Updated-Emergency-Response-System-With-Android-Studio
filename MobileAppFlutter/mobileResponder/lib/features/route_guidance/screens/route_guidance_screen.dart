import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';

class RouteGuidanceScreen extends StatefulWidget {
  final double lat;
  final double lng;
  final String label;

  const RouteGuidanceScreen({super.key, required this.lat, required this.lng, required this.label});

  @override
  State<RouteGuidanceScreen> createState() => _RouteGuidanceScreenState();
}

class _RouteGuidanceScreenState extends State<RouteGuidanceScreen> {
  Future<void> _openWaze() async {
    final uri = Uri.parse('https://waze.com/ul?ll=${widget.lat},${widget.lng}&navigate=yes');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      _openGoogleMaps();
    }
  }

  Future<void> _openGoogleMaps() async {
    final uri = Uri.parse('https://maps.google.com/maps?daddr=${widget.lat},${widget.lng}');
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go('/map'),
        ),
        title: Text(widget.label, overflow: TextOverflow.ellipsis),
      ),
      body: Column(
        children: [
          Expanded(
            child: FlutterMap(
              options: MapOptions(initialCenter: LatLng(widget.lat, widget.lng), initialZoom: 15),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.safealert.app',
                ),
                MarkerLayer(markers: [
                  Marker(
                    point: LatLng(widget.lat, widget.lng),
                    child: const Icon(Icons.location_pin, color: AppColors.alertRed, size: 48),
                  ),
                ]),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            color: AppColors.surface,
            child: Column(
              children: [
                Text(widget.label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('${widget.lat.toStringAsFixed(5)}, ${widget.lng.toStringAsFixed(5)}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: AppButton(label: 'Open in Waze', onPressed: _openWaze, icon: Icons.navigation)),
                  const SizedBox(width: 12),
                  Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.map), label: const Text('Google Maps'), onPressed: _openGoogleMaps)),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
