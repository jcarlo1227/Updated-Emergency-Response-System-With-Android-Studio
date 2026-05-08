import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/services/offline_sync_service.dart';
import 'core/theme/app_theme.dart';
import 'core/routing/app_router.dart';
import 'features/emergency/providers/emergency_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await Hive.openBox<String>('offline_queue');
  await Hive.openBox<String>('pending_alerts');
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const ProviderScope(child: SafeAlertApp()));
}

class SafeAlertApp extends ConsumerStatefulWidget {
  const SafeAlertApp({super.key});

  @override
  ConsumerState<SafeAlertApp> createState() => _SafeAlertAppState();
}

class _SafeAlertAppState extends ConsumerState<SafeAlertApp> {
  StreamSubscription? _syncSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final syncService = ref.read(offlineSyncServiceProvider);
      _syncSub = syncService.onAlertSynced.listen((em) {
        ref.read(emergencyProvider.notifier).setActive(em);
      });
    });
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'SafeAlert',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
