import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useFrameCallback,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 220; // Optimized for 60fps Fluidity
const SPHERE_RADIUS = 120;

// Helper to generate random spherical coordinates
const generateParticles = (count) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
        // Fibonacci sphere distribution for even spread
        const phi = Math.acos(1 - 2 * (i + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i; // Regular placement

        particles.push({
            id: i,
            initialTheta: theta,
            initialPhi: phi,
            size: 2.5, // Uniform size
            baseSpeed: 0.5, // Slower base rotation for calmness
            driftSpeed: Math.random() * 0.5 + 0.2, // Random drift speed
            phase: Math.random() * Math.PI * 2, // Random starting phase
        });
    }
    return particles;
};

const Particle = ({ data, time, audioLevel, touchX, touchY, isTouching, mode }) => {
    const style = useAnimatedStyle(() => {
        // 1. Calculate Base 3D Position
        // Rotate theta over time
        // Speed up rotation when "processing" or "speaking"


        // Audio reactivity: Ripple/Wave Effect
        // Creates a wave that travels along the sphere surface
        const ripple = Math.sin(data.initialPhi * 10 - time.value * 2) * (audioLevel.value * 15);

        // Base expansion + Ripple
        const currentRadius = SPHERE_RADIUS + (audioLevel.value * 10) + ripple;


        // Fluid Drift Logic
        // Add independent movement to each particle so they don't move as a rigid block
        const driftTheta = Math.sin(time.value * data.driftSpeed + data.phase) * 0.2;
        const driftPhi = Math.cos(time.value * data.driftSpeed + data.phase) * 0.1;

        const currentTheta = data.initialTheta + (time.value * data.baseSpeed) + driftTheta;
        const currentPhi = data.initialPhi + driftPhi;

        let x = currentRadius * Math.sin(currentPhi) * Math.cos(currentTheta);
        let y = currentRadius * Math.sin(currentPhi) * Math.sin(currentTheta);
        let z = currentRadius * Math.cos(currentPhi);

        // 2. Touch Repulsion
        if (isTouching.value) {
            const dx = x - touchX.value;
            const dy = y - touchY.value;
            const dist = Math.sqrt(dx * dx + dy * dy);


            // Repulsion radius = 150
            if (dist < 150) {
                const force = (150 - dist) * 1.5; // Strength varies by distance
                const angle = Math.atan2(dy, dx);
                x += Math.cos(angle) * force;
                y += Math.sin(angle) * force;
            }
        }

        // 3. Audio Jitter (Excitement)
        // If speaking, add wave motion to Z
        if (mode === 'speaking') {
            z += Math.sin(time.value * 5 + data.id) * (audioLevel.value * 20);
        }

        // 4. Project 3D to 2D
        // Simple perspective projection
        const cameraDist = 400;
        const scale = cameraDist / (cameraDist - z);

        const finalX = x * scale;
        const finalY = y * scale;
        const opacity = interpolate(z, [-SPHERE_RADIUS, SPHERE_RADIUS], [0.1, 1], Extrapolate.CLAMP);

        // Color Logic
        let backgroundColor = '#0ea5e9'; // Cyan (Listening)
        if (mode === 'processing') backgroundColor = '#8b5cf6'; // Violet
        if (mode === 'speaking') {
            // White/Blue pulse
            backgroundColor = z > 0 ? '#FFFFFF' : '#0ea5e9';
        }

        return {
            transform: [
                { translateX: finalX },
                { translateY: finalY },
                { scale: scale } // Scale based on depth
            ],
            opacity: opacity,
            backgroundColor: backgroundColor,
            // Static styles moved to StyleSheet (except color which animates)
        };
    });

    return <Animated.View style={[styles.particle, style, { width: data.size, height: data.size, borderRadius: data.size / 2 }]} />;
};

const VoiceParticleSphere = ({ mode = 'listening', audioLevel = 0, onClose, onStop }) => {
    const particles = useMemo(() => generateParticles(PARTICLE_COUNT), []);

    // Shared Values
    const time = useSharedValue(0);
    const audioVal = useSharedValue(0);
    const touchX = useSharedValue(0);
    const touchY = useSharedValue(0);
    const isTouching = useSharedValue(false);

    // Frame Loop for Smooth Rotation
    useFrameCallback((frameInfo) => {
        if (!frameInfo.timeSincePreviousFrame) return;

        // Calculate speed multiplier based on mode
        let speed = 0.0005; // Base slow rotation
        if (mode === 'processing') speed = 0.002; // Fast spin
        if (mode === 'speaking') speed = 0.0002; // Very slow, focused on pulse

        // Accumulate rotation
        time.value += frameInfo.timeSincePreviousFrame * speed;
    });

    // Sync audio level to shared value
    useEffect(() => {
        audioVal.value = withSpring(audioLevel, { damping: 15 });
    }, [audioLevel]);

    const gesture = Gesture.Pan()
        .onBegin((e) => {
            touchX.value = e.x - 150; // Center offset (container is 300x300 typically)
            touchY.value = e.y - 150;
            isTouching.value = true;
        })
        .onUpdate((e) => {
            touchX.value = e.x - 150;
            touchY.value = e.y - 150;
        })
        .onFinalize(() => {
            isTouching.value = false;
        });

    const getStatusText = () => {
        switch (mode) {
            case 'listening': return "I'm listening — tap ✓ when done";
            case 'processing': return "Processing...";
            case 'speaking': return "Speaking...";
            default: return "Tap to speak";
        }
    };

    return (
        <View style={styles.container}>
            <GestureHandlerRootView style={styles.gestureArea}>
                <GestureDetector gesture={gesture}>
                    <View style={styles.sphereContainer}>
                        {particles.map((p) => (
                            <Particle
                                key={p.id}
                                data={p}
                                time={time}
                                audioLevel={audioVal}
                                touchX={touchX}
                                touchY={touchY}
                                isTouching={isTouching}
                                mode={mode}
                            />
                        ))}
                    </View>
                </GestureDetector>
            </GestureHandlerRootView>

            <Text style={styles.statusText}>{getStatusText()}</Text>

            <View style={styles.controls}>
                {/* Cancel — discards the recording */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>

                {/* Done — stop and send what was said. Only while recording. */}
                {mode === 'listening' && onStop && (
                    <TouchableOpacity style={styles.doneButton} onPress={onStop}>
                        <Ionicons name="checkmark" size={30} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.92)', // Deep dark focused background
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    gestureArea: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(255,0,0,0.1)', // Debug touch area
    },
    sphereContainer: {
        width: 0,
        height: 0, // Particles are absolute, so container is 0x0 center point
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        color: '#a1a1aa',
        fontSize: 18,
        fontWeight: '400',
        marginTop: 60,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    controls: {
        position: 'absolute',
        bottom: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
    },
    closeButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    particle: {
        position: 'absolute',
    }
});

export default VoiceParticleSphere;
