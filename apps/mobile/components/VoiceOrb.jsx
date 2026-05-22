import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const VoiceOrb = ({ mode = 'listening', audioLevel = 0, onClose }) => {
    // Shared values for animations
    const coreScale = useSharedValue(1);
    const ring1Scale = useSharedValue(1);
    const ring2Scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    // Base colors
    const PRIMARY_COLOR = '#0ea5e9'; // Sky blue
    const THINKING_COLOR = '#8b5cf6'; // Violet

    useEffect(() => {
        // Continuous rotation for the "living" feel
        rotation.value = withRepeat(
            withTiming(360, { duration: 8000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    useEffect(() => {
        // Reset or stop previous animations when mode changes
        cancelAnimation(coreScale);
        cancelAnimation(ring1Scale);
        cancelAnimation(ring2Scale);
        cancelAnimation(rotation);

        if (mode === 'listening') {
            // LISTENING: Core pulses with volume, Rings breathe
            // 1. Core: Dynamic spring based on audioLevel
            const targetScale = 1 + (audioLevel * 0.8);
            coreScale.value = withSpring(targetScale, { damping: 10, stiffness: 100 });

            // 2. Rings: Slow breathing
            ring1Scale.value = withRepeat(withSequence(withTiming(1.15, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true);
            ring2Scale.value = withRepeat(withSequence(withTiming(1.25, { duration: 2500 }), withTiming(1, { duration: 2500 })), -1, true);

            // 3. Rotation: Slow and steady
            rotation.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1, false);

        } else if (mode === 'processing') {
            // PROCESSING: Fast spin, core throb
            coreScale.value = withRepeat(withSequence(withTiming(0.9, { duration: 400 }), withTiming(1.1, { duration: 400 })), -1, true);

            // Rings: Pulse faster
            ring1Scale.value = withRepeat(withSequence(withTiming(1.3, { duration: 800 }), withTiming(0.8, { duration: 800 })), -1, true);
            ring2Scale.value = withRepeat(withSequence(withTiming(1.4, { duration: 800 }), withTiming(0.8, { duration: 800 })), -1, true);

            // Rotation: Much faster
            rotation.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false);

        } else if (mode === 'speaking') {
            // SPEAKING: Ripple effect
            coreScale.value = withSpring(1.2); // Core stays slightly enlarged

            // Rings: Expand outward and fade (illusion of ripples)
            // We use a sequence of expansion -> reset to 1 -> repeat
            ring1Scale.value = withRepeat(withSequence(
                withTiming(1, { duration: 0 }), // Reset
                withTiming(1.6, { duration: 1000, easing: Easing.out(Easing.quad) })
            ), -1, false);

            ring2Scale.value = withRepeat(withSequence(
                withTiming(1, { duration: 0 }), // Reset
                withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.quad) }),
            ), -1, false);

            // Rotation: Moderate
            rotation.value = withRepeat(withTiming(360, { duration: 5000, easing: Easing.linear }), -1, false);
        }
    }, [mode, audioLevel]);


    const coreStyle = useAnimatedStyle(() => {
        const backgroundColor = mode === 'processing' ? THINKING_COLOR : PRIMARY_COLOR;
        return {
            transform: [{ scale: coreScale.value }],
            backgroundColor,
        };
    });

    const ring1Style = useAnimatedStyle(() => {
        const borderColor = mode === 'processing' ? THINKING_COLOR : PRIMARY_COLOR;
        return {
            transform: [{ scale: ring1Scale.value }, { rotate: `${rotation.value}deg` }],
            opacity: interpolate(ring1Scale.value, [1, 1.5], [0.6, 0]),
            borderColor,
        };
    });

    const ring2Style = useAnimatedStyle(() => {
        const borderColor = mode === 'processing' ? THINKING_COLOR : PRIMARY_COLOR;
        return {
            transform: [{ scale: ring2Scale.value }, { rotate: `${-rotation.value}deg` }],
            opacity: interpolate(ring2Scale.value, [1, 1.8], [0.4, 0]),
            borderColor,
        };
    });

    const getStatusText = () => {
        switch (mode) {
            case 'listening': return "Listening...";
            case 'processing': return "Thinking...";
            case 'speaking': return "Speaking...";
            default: return "Tap to speak";
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.orbContainer}>
                <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />
                <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
                <Animated.View style={[styles.core, coreStyle]}>
                    <Ionicons name={mode === 'listening' ? "mic" : "sparkles"} size={32} color="#FFF" />
                </Animated.View>
            </View>

            <Text style={styles.statusText}>{getStatusText()}</Text>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)', // Minimal aesthetic
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    orbContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    core: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#0ea5e9",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 25,
        elevation: 15,
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2,
    },
    ring1: {
        width: 120,
        height: 120,
        borderStyle: 'solid',
    },
    ring2: {
        width: 160,
        height: 160,
        borderStyle: 'dotted',
    },
    statusText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '300',
        marginTop: 60,
        letterSpacing: 1.5,
    },
    closeButton: {
        position: 'absolute',
        bottom: 60,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default VoiceOrb;
