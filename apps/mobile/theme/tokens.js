// Casyomax design tokens — single source of truth for the modern design system.
// Personality: Indigo primary with cyan/violet "voice" accents that tie into the
// existing voice sphere. Consumed via the ThemeProvider (see ThemeProvider.jsx),
// never hardcoded in screens.

// --- Raw color scales ---------------------------------------------------------
const palette = {
    // Brand indigo
    indigo50: '#EEF0FF',
    indigo100: '#E0E2FF',
    indigo200: '#C7CBFF',
    indigo300: '#A5ABFF',
    indigo400: '#818CF8',
    indigo500: '#6366F1',
    indigo600: '#4F46E5', // primary
    indigo700: '#4338CA',
    indigo800: '#3730A3',
    indigo900: '#262168',

    // Voice accents
    cyan400: '#22D3EE',
    cyan500: '#06B6D4',
    violet400: '#A78BFA',
    violet500: '#8B5CF6',
    violet600: '#7C3AED',

    // Neutral slate
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    slate950: '#020617',

    // Status
    green500: '#16A34A',
    green100: '#DCFCE7',
    amber500: '#F59E0B',
    amber100: '#FEF3C7',
    red500: '#EF4444',
    red100: '#FEE2E2',

    white: '#FFFFFF',
    black: '#000000',
};

// --- Spacing (4pt scale) ------------------------------------------------------
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

// --- Radius -------------------------------------------------------------------
export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
};

// --- Typography ---------------------------------------------------------------
// Font families map to weights loaded from @expo-google-fonts/plus-jakarta-sans.
export const fonts = {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extrabold: 'PlusJakartaSans_800ExtraBold',
};

// Variant -> { fontSize, lineHeight, family }
export const typography = {
    displayLg: { fontSize: 32, lineHeight: 38, family: fonts.extrabold },
    display: { fontSize: 28, lineHeight: 34, family: fonts.bold },
    titleLg: { fontSize: 22, lineHeight: 28, family: fonts.bold },
    title: { fontSize: 20, lineHeight: 26, family: fonts.bold },
    subtitle: { fontSize: 16, lineHeight: 22, family: fonts.semibold },
    bodyLg: { fontSize: 16, lineHeight: 24, family: fonts.regular },
    body: { fontSize: 14, lineHeight: 20, family: fonts.regular },
    label: { fontSize: 13, lineHeight: 18, family: fonts.semibold },
    caption: { fontSize: 12, lineHeight: 16, family: fonts.medium },
};

// --- Motion -------------------------------------------------------------------
export const motion = {
    fast: 150,
    base: 250,
    slow: 400,
    pressScale: 0.97,
};

// --- Semantic themes ----------------------------------------------------------
export const lightColors = {
    // Surfaces
    background: '#F5F6FC', // subtle indigo-tinted neutral
    surface: palette.white,
    surfaceAlt: palette.slate100,
    surfaceSunken: palette.slate50,
    overlay: 'rgba(15, 23, 42, 0.45)',

    // Text
    text: palette.slate900,
    textSecondary: palette.slate600,
    textMuted: palette.slate400,
    textOnPrimary: palette.white,

    // Brand
    primary: palette.indigo600,
    primaryHover: palette.indigo700,
    primarySoft: palette.indigo50,
    primaryBorder: palette.indigo200,

    // Accents
    accentCyan: palette.cyan500,
    accentViolet: palette.violet500,

    // Lines
    border: palette.slate200,
    borderStrong: palette.slate300,

    // Status (fg + soft bg)
    success: palette.green500,
    successSoft: palette.green100,
    warning: palette.amber500,
    warningSoft: palette.amber100,
    danger: palette.red500,
    dangerSoft: palette.red100,

    // Misc
    icon: palette.slate500,
    scrim: 'rgba(2, 6, 23, 0.5)',
};

export const darkColors = {
    background: '#0A0E1A',
    surface: '#121829',
    surfaceAlt: '#1B2236',
    surfaceSunken: '#0E1422',
    overlay: 'rgba(0, 0, 0, 0.6)',

    text: palette.slate50,
    textSecondary: palette.slate300,
    textMuted: palette.slate500,
    textOnPrimary: palette.white,

    primary: palette.indigo400,
    primaryHover: palette.indigo300,
    primarySoft: 'rgba(99, 102, 241, 0.16)',
    primaryBorder: 'rgba(129, 140, 248, 0.35)',

    accentCyan: palette.cyan400,
    accentViolet: palette.violet400,

    border: '#26304A',
    borderStrong: palette.slate700,

    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.15)',
    warning: '#FBBF24',
    warningSoft: 'rgba(251, 191, 36, 0.15)',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.15)',

    icon: palette.slate400,
    scrim: 'rgba(0, 0, 0, 0.6)',
};

// --- Elevation (theme-aware factory) -----------------------------------------
// Soft, layered shadows. iOS uses shadow*, Android uses elevation.
export const makeShadows = (scheme) => {
    const shadowColor = scheme === 'dark' ? '#000000' : '#1E293B';
    const op = scheme === 'dark' ? 0.5 : 0.12;
    return {
        none: {},
        sm: {
            shadowColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: op * 0.7,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: op,
            shadowRadius: 14,
            elevation: 5,
        },
        lg: {
            shadowColor,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: op * 1.2,
            shadowRadius: 28,
            elevation: 10,
        },
    };
};

export { palette };
