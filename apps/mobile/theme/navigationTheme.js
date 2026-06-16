import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { darkColors, lightColors, fonts } from './tokens';

// Builds @react-navigation themes from our tokens so native headers, card
// backgrounds and borders match the design system.
export function buildNavTheme(scheme) {
    const c = scheme === 'dark' ? darkColors : lightColors;
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
        ...base,
        colors: {
            ...base.colors,
            primary: c.primary,
            background: c.background,
            card: c.surface,
            text: c.text,
            border: c.border,
            notification: c.primary,
        },
        fonts: base.fonts, // keep RN Navigation's font config shape intact
    };
}

export const NAV_HEADER_FONT = fonts.bold;
