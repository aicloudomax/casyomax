import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

function initialsFrom(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
}

/**
 * Avatar with image fallback to a gradient + initials.
 * size: pixel diameter (default 44).
 */
export function Avatar({ uri, name, initials, size = 44, style }) {
    const { colors } = useTheme();
    const text = initials || initialsFrom(name);
    const fontSize = Math.round(size * 0.36);

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={[
                    { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceAlt },
                    style,
                ]}
            />
        );
    }

    return (
        <LinearGradient
            colors={[colors.primary, colors.accentViolet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                style,
            ]}
        >
            <AppText weight="bold" style={{ color: '#FFFFFF', fontSize }}>
                {text}
            </AppText>
        </LinearGradient>
    );
}

export default Avatar;
