import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';

const EmptyStateCard = ({ iconName, message, subMessage }) => {
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={64} color={colors.primary} />
            </View>
            <AppText variant="title" align="center" style={styles.message}>{message}</AppText>
            {subMessage && (
                <AppText variant="body" color="textSecondary" align="center">{subMessage}</AppText>
            )}
        </View>
    );
};

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    return StyleSheet.create({
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            backgroundColor: c.surface,
            borderRadius: r.lg,
            margin: 16,
            borderWidth: 1,
            borderColor: c.border,
            borderStyle: 'dashed',
        },
        iconContainer: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: c.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
        },
        message: {
            marginBottom: 8,
        },
    });
};

export default EmptyStateCard;
