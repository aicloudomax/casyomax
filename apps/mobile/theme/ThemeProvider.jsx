import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
    darkColors,
    lightColors,
    makeShadows,
    motion,
    radius,
    spacing,
    typography,
    fonts,
} from './tokens';

const ThemeContext = createContext(null);

/**
 * Provides the active theme (light/dark) derived from the OS color scheme.
 * Consume with useTheme(): const { colors, spacing, radius, typography, shadows } = useTheme();
 */
export function ThemeProvider({ children, forcedScheme }) {
    const systemScheme = useColorScheme();
    const scheme = forcedScheme || systemScheme || 'light';

    const value = useMemo(() => {
        const colors = scheme === 'dark' ? darkColors : lightColors;
        return {
            scheme,
            isDark: scheme === 'dark',
            colors,
            spacing,
            radius,
            typography,
            fonts,
            motion,
            shadows: makeShadows(scheme),
        };
    }, [scheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}
