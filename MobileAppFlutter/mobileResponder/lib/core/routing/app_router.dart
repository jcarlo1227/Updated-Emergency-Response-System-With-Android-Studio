import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/registration_screen.dart';
import '../../features/auth/screens/pending_approval_screen.dart';
import '../../features/duty_status/screens/duty_status_screen.dart';
import '../../features/emergency_map/screens/emergency_map_screen.dart';
import '../../features/ambulance_assignments/screens/ambulance_list_screen.dart';
import '../../features/ambulance_assignments/screens/ambulance_detail_screen.dart';
import '../../features/route_guidance/screens/route_guidance_screen.dart';
import '../../features/response_reports/screens/report_form_screen.dart';
import '../../features/settings/screens/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authProvider.notifier);
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      if (authState is AuthLoading || state.matchedLocation == '/splash') return null;
      final isLoggedIn = authState is AuthAuthenticated;
      final isPending = authState is AuthPending;
      final isOnAuth = state.matchedLocation.startsWith('/login') || state.matchedLocation.startsWith('/register');
      if (!isLoggedIn && !isPending && !isOnAuth) return '/login';
      if (isPending && !state.matchedLocation.startsWith('/pending')) return '/pending';
      if (isLoggedIn && isOnAuth) return '/duty';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegistrationScreen()),
      GoRoute(path: '/pending', builder: (_, __) => const PendingApprovalScreen()),
      GoRoute(path: '/duty', builder: (_, __) => const DutyStatusScreen()),
      GoRoute(
        path: '/map',
        builder: (_, __) => const EmergencyMapScreen(),
        routes: [
          GoRoute(path: 'report/:id', builder: (_, s) => ReportFormScreen(emergencyId: s.pathParameters['id']!)),
        ],
      ),
      GoRoute(path: '/ambulance', builder: (_, __) => const AmbulanceListScreen()),
      GoRoute(path: '/ambulance/:id', builder: (_, s) => AmbulanceDetailScreen(requestId: s.pathParameters['id']!)),
      GoRoute(path: '/route', builder: (_, s) {
        final extra = s.extra as Map<String, dynamic>? ?? {};
        return RouteGuidanceScreen(
          lat: (extra['lat'] as num?)?.toDouble() ?? 14.355,
          lng: (extra['lng'] as num?)?.toDouble() ?? 120.885,
          label: extra['label'] as String? ?? 'Destination',
        );
      }),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    ],
    errorBuilder: (_, state) => Scaffold(body: Center(child: Text('Not found: ${state.error}'))),
  );
});
