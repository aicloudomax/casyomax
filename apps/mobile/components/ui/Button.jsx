import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SIZES = {
    sm: { padV: 8, padH: 14, font: 'label', icon: 16, radius: 'md', gap: 6 },
    md: { padV: 13, padH: 18, font: 'subtitle', icon: 18, radius: 'lg', gap: 8 },
    lg: { padV: 16, padH: 22, font: 'subtitle', icon: 20, radius: 'lg', gap: 10 },
};

/**
 * Button primitive with press-scale animation.
 * variant: primary | secondary | ghost | danger
 * size: sm | md | lg
 */
export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    disabled = false,
    fullWidth = false,
    color,
    style,
}) {
    const { colors, radius, motion } = useTheme();
    const scale = useSharedValue(1);
    const s = SIZES[size] || SIZES.md;

    const palettes = {
        primary: { bg: colors.primary, fg: colors.textOnPrimary, border: 'transparent' },
        secondary: { bg: colors.primarySoft, fg: colors.primary, border: colors.primaryBorder },
        ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
        danger: { bg: colors.danger, fg: '#FFFFFF', border: 'transparent' },
    };
    const base = palettes[variant] || palettes.primary;
    const p = { ...base, fg: color || base.fg };
    const isDisabled = disabled || loading;

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <AnimatedPressable
            onPress={isDisabled ? undefined : onPress}
            onPressIn={() => (scale.value = withTiming(motion.pressScale, { duration: motion.fast }))}
            onPressOut={() => (scale.value = withTiming(1, { duration: motion.fast }))}
            disabled={isDisabled}
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: s.gap,
                    paddingVertical: s.padV,
                    paddingHorizontal: s.padH,
                    borderRadius: radius[s.radius],
                    backgroundColor: p.bg,
                    borderWidth: p.border === 'transparent' ? 0 : 1,
                    borderColor: p.border,
                    opacity: isDisabled ? 0.55 : 1,
                    alignSelf: fullWidth ? 'stretch' : 'flex-start',
                },
                animStyle,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={p.fg} />
            ) : (
                <>
                    {icon ? <Ionicons name={icon} size={s.icon} color={p.fg} /> : null}
                    {title ? (
                        <AppText variant={s.font} weight="semibold" style={{ color: p.fg }}>
                            {title}
                        </AppText>
                    ) : null}
                    {iconRight ? <Ionicons name={iconRight} size={s.icon} color={p.fg} /> : null}
                </>
            )}
        </AnimatedPressable>
    );
}

export default Button;
