import { Pressable, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Surface card primitive.
 * elevation: none | sm | md | lg (default "sm")
 * padded: applies lg padding (default true)
 * onPress: makes the card pressable with a subtle press-scale.
 */
export function Card({
    children,
    elevation = 'sm',
    padded = true,
    onPress,
    bordered = true,
    style,
}) {
    const { colors, radius, spacing, shadows, motion } = useTheme();
    const scale = useSharedValue(1);

    const baseStyle = {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: padded ? spacing.lg : 0,
        borderWidth: bordered ? 1 : 0,
        borderColor: colors.border,
        ...(shadows[elevation] || shadows.sm),
    };

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    if (!onPress) {
        return <View style={[baseStyle, style]}>{children}</View>;
    }

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={() => (scale.value = withTiming(0.985, { duration: motion.fast }))}
            onPressOut={() => (scale.value = withTiming(1, { duration: motion.fast }))}
            style={[baseStyle, animStyle, style]}
        >
            {children}
        </AnimatedPressable>
    );
}

export default Card;
