import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.light(
          primary: AppColors.responderBlue,
          secondary: AppColors.alertRed,
          surface: AppColors.surface,
          onPrimary: AppColors.surface,
          onSurface: AppColors.textStrong,
          error: AppColors.alertRed,
          outline: AppColors.border,
        ),
        textTheme: GoogleFonts.interTextTheme(const TextTheme(
          displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppColors.textStrong),
          headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textStrong),
          titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textStrong),
          bodyMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.textStrong),
          labelSmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted),
        )),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.adminNavy,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.responderBlue,
            foregroundColor: AppColors.surface,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textStrong,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            side: const BorderSide(color: AppColors.border),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.responderBlue, width: 2)),
          errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.alertRed)),
          labelStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
        ),
        cardTheme: CardThemeData(
          color: AppColors.surface,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)),
          margin: EdgeInsets.zero,
        ),
      );
}
