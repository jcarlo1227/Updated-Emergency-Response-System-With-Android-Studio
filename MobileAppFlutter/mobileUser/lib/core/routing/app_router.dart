import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/registration_step1_screen.dart';
import '../../features/auth/screens/registration_step2_screen.dart';
import '../../features/auth/screens/pending_approval_screen.dart';
import '../../features/emergency/screens/emergency_home_screen.dart';
import '../../features/emergency/screens/emergency_confirmation_screen.dart';
import '../../features/emergency/screens/active_emergency_screen.dart';
import '../../features/emergency/screens/emergency_history_screen.dart';
import '../../features/ambulance_transport/screens/ambulance_form_screen.dart';
import '../../features/ambulance_transport/screens/ambulance_tracking_screen.dart';
import '../../features/ble_panic_button/screens/ble_pairing_screen.dart';
import '../../features/map/screens/nearby_facilities_screen.dart';
import '../../features/settings/screens/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authProvider.notifier);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final authState = authNotifier.state;
      final isLoading = authState is AuthLoading;
      final isSplash = state.matchedLocation == '/splash';
      if (isLoading || isSplash) return null;

      final isLoggedIn = authState is AuthAuthenticated;
      final isPending = authState is AuthPending;
      final isOnAuth = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/register');

      if (!isLoggedIn && !isPending && !isOnAuth) return '/login';
      if (isPending && !state.matchedLocation.startsWith('/pending')) return '/pending';
      if (isLoggedIn && isOnAuth) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegistrationStep1Screen()),
      GoRoute(path: '/register/step2', builder: (_, s) {
        final extra = s.extra as Map<String, dynamic>?;
        return RegistrationStep2Screen(step1Data: extra ?? {});
      }),
      GoRoute(path: '/pending', builder: (_, _) => const PendingApprovalScreen()),
      GoRoute(
        path: '/home',
        builder: (_, _) => const EmergencyHomeScreen(),
        routes: [
          GoRoute(
            path: 'emergency/confirm',
            builder: (_, s) => EmergencyConfirmationScreen(
              emergencyType: s.uri.queryParameters['type'] ?? 'general_sos',
            ),
          ),
          GoRoute(
            path: 'emergency/:id',
            builder: (_, s) => ActiveEmergencyScreen(emergencyId: s.pathParameters['id']!),
          ),
          GoRoute(path: 'history', builder: (_, _) => const EmergencyHistoryScreen()),
          GoRoute(path: 'ambulance/new', builder: (_, s) {
            final t = (s.uri.queryParameters['type'] ?? 'emergency');
            return AmbulanceFormScreen(requestType: t);
          }),
          GoRoute(
            path: 'ambulance/:id',
            builder: (_, s) => AmbulanceTrackingScreen(requestId: s.pathParameters['id']!),
          ),
          GoRoute(path: 'ble', builder: (_, _) => const BlePairingScreen()),
          GoRoute(path: 'map', builder: (_, _) => const NearbyFacilitiesScreen()),
          GoRoute(path: 'settings', builder: (_, _) => const SettingsScreen()),
        ],
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.error}')),
    ),
  );
});
