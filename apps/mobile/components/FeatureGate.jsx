import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

/**
 * Component to wrap premium features.
 * Shows a lock overlay for free-tier users.
 */
export const FeatureGate = ({ children, feature, plan, message }) => {
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

    // Premium users always see the content
    if (plan === 'premium') {
        return children;
    }

    // Default message for generic locks
    const displayMessage = message || "This is a Premium feature";

    return (
        <View style={styles.container}>
            {/* The actual component is blurred/dimmed in the background */}
            <View style={styles.contentDimmed} pointerEvents="none">
                {children}
            </View>

            {/* Lock Overlay */}
            <View style={styles.overlay}>
                <Ionicons name="lock-closed" size={24} color={colors.textOnPrimary} />
                <AppText variant="subtitle" align="center" style={styles.lockText}>
                    {displayMessage}
                </AppText>
                <Button
                    title="Upgrade to Premium"
                    size="sm"
                    onPress={() => router.push('/(patient)/plan')}
                    style={styles.upgradeButton}
                />
            </View>
        </View>
    );
};

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    return StyleSheet.create({
        container: {
            position: 'relative',
            borderRadius: r.md,
            overflow: 'hidden',
        },
        contentDimmed: {
            opacity: 0.3,
        },
        overlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: c.overlay,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            borderRadius: r.md,
        },
        lockText: {
            color: c.textOnPrimary,
            marginTop: 8,
        },
        upgradeButton: {
            marginTop: 12,
        },
    });
};
