/*
 * Adaptive Learning Platform — Flutter Theme (Generated from design-tokens.css)
 * Token export for Flutter; values match ui-prototype/design-tokens.css
 * (EdX v2 primary #EB7441, Coursera blue #0056D2, warm neutrals).
 */
import 'package:flutter/material.dart';

class AlTokens {
  AlTokens._();

  // ---- Colors (light mode; see AlTheme.darkTheme for dark mode) ----
  static const Color bg = Color(0xFFF9F8F6);        // EdX cream canvas
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surface2 = Color(0xFFFAF9F7);
  static const Color surface3 = Color(0xFFF2F0EC);

  static const Color text = Color(0xFF1C1E21);      // EdX neutral-900
  static const Color textMuted = Color(0xFF434953); // EdX gray-500
  static const Color textDim = Color(0xFF5C5C53);   // EdX gray-600

  static const Color border = Color(0xFFE6E4DC);
  static const Color borderStrong = Color(0xFFC8C4BA);

  // Primary — EdX orange
  static const Color primary = Color(0xFFEB7441);
  static const Color primaryLight = Color(0xFFF5BCA4);
  static const Color primaryDark = Color(0xFFD74000);
  static const Color primaryBg = Color(0xFFFBE4D5);

  // Secondary — Coursera blue
  static const Color secondary = Color(0xFF0056D2);
  static const Color secondaryLight = Color(0xFFE8F0FC);

  // Feedback palette
  static const Color success = Color(0xFF28A745);
  static const Color warning = Color(0xFFF0AD4E);
  static const Color danger = Color(0xFFDC3545);
  static const Color info = Color(0xFF17A2B8);
  static const Color onSuccess = Color(0xFFFFFFFF);

  // ---- Radius ----
  static const double radiusXs = 2.0;
  static const double radiusSm = 4.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 12.0;
  static const double radiusXl = 16.0;
  static const double radiusPill = 9999.0;

  // ---- Typography (Inter via google_fonts-like) ----
  static const TextStyle displayLarge = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, fontSize: 40.0, height: 1.2);
  static const TextStyle displayMd = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, fontSize: 32.0, height: 1.2);
  static const TextStyle headingLg = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, fontSize: 30.0);
  static const TextStyle headingMd = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, fontSize: 28.0);
  static const TextStyle headingSm = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, fontSize: 24.0);
  static const TextStyle bodyLg = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w400, fontSize: 20.0, height: 1.6);
  static const TextStyle body = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w400, fontSize: 16.0, height: 1.6);
  static const TextStyle bodySm = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w400, fontSize: 14.0, height: 1.45);
  static const TextStyle bodyXs = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w400, fontSize: 13.0);
  static const TextStyle caption = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w500, fontSize: 12.0);
  static const TextStyle overline = TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600, fontSize: 11.0, letterSpacing: 0.5, color: AlTokens.textDim);
}

extension AlThemeExt on ThemeData {
  ThemeData get alTheme => copyWith(
        colorScheme: colorScheme.copyWith(
          primary: AlTokens.primary,
          secondary: AlTokens.secondary,
          onPrimary: AlTokens.primaryFg(),
          primaryContainer: AlTokens.primaryBg,
          surfaceTint: AlTokens.primary,
        ),
        scaffoldBackgroundColor: AlTokens.bg,
        cardColor: AlTokens.surface,
      );
}

extension AlThemeExt on ThemeData {
  ThemeData alTheme() => copyWith(
        colorScheme: colorScheme.copyWith(
          primary: AlTokens.primary,
          secondary: AlTokens.secondary,
          primaryContainer: AlTokens.primaryBg,
          surfaceTint: AlTokens.primary,
        ),
        scaffoldBackgroundColor: AlTokens.bg,
        cardColor: AlTokens.surface,
      );
}
