import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * On-brand animated toggle (replacement for RN Switch).
 * value: boolean, onValueChange: (next) => void
 * size: sm | md
 */
export function Toggle({ value, onValueChange, disabled = false, size = 'md' }) {
    const { colors, motion } = useTheme();
    const dims = size === 'sm' ? { w: 42, h: 26, thumb: 20 } : { w: 50, h: 30, thumb: 24 };
    const pad = 3;
    const travel = dims.w - dims.thumb - pad * 2;

    const progress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, { duration: motion.base });
    }, [value, motion.base, progress]);

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [colors.borderStrong, colors.primary]
        ),
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: progress.value * travel }],
    }));

    return (
        <Pressable
            onPress={() => !disabled && onValueChange?.(!value)}
            disabled={disabled}
            hitSlop={8}
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <Animated.View
                style={[
                    {
                        width: dims.w,
                        height: dims.h,
                        borderRadius: dims.h / 2,
                        padding: pad,
                        justifyContent: 'center',
                    },
                    trackStyle,
                ]}
            >
                <Animated.View
                    style={[
                        {
                            width: dims.thumb,
                            height: dims.thumb,
                            borderRadius: dims.thumb / 2,
                            backgroundColor: '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 2,
                            elevation: 2,
                        },
                        thumbStyle,
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
}

export default Toggle;
