import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Round icon button.
 * variant: soft | ghost | solid
 */
export function IconButton({ icon, onPress, size = 40, iconSize, variant = 'soft', color, style }) {
    const { colors, radius, motion } = useTheme();
    const scale = useSharedValue(1);

    const variants = {
        soft: { bg: colors.surfaceAlt, fg: color || colors.text },
        ghost: { bg: 'transparent', fg: color || colors.icon },
        solid: { bg: colors.primary, fg: color || colors.textOnPrimary },
    };
    const v = variants[variant] || variants.soft;

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={() => (scale.value = withTiming(0.9, { duration: motion.fast }))}
            onPressOut={() => (scale.value = withTiming(1, { duration: motion.fast }))}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: v.bg,
                },
                animStyle,
                style,
            ]}
        >
            <Ionicons name={icon} size={iconSize || Math.round(size * 0.5)} color={v.fg} />
        </AnimatedPressable>
    );
}

export default IconButton;
