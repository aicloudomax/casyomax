import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';

// Branded toast used for all Toast.show() calls across the app.
const ToastCard = ({ tone, icon, text1, text2 }) => {
    const { colors, radius, spacing, shadows } = useTheme();
    const tones = {
        success: { fg: colors.success, soft: colors.successSoft },
        error: { fg: colors.danger, soft: colors.dangerSoft },
        info: { fg: colors.primary, soft: colors.primarySoft },
    };
    const t = tones[tone] || tones.info;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                width: '92%',
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 4,
                borderLeftColor: t.fg,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                ...shadows.md,
            }}
        >
            <View
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: t.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name={icon} size={18} color={t.fg} />
            </View>
            <View style={{ flex: 1 }}>
                {text1 ? <AppText variant="subtitle" numberOfLines={1}>{text1}</AppText> : null}
                {text2 ? (
                    <AppText variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 1 }}>
                        {text2}
                    </AppText>
                ) : null}
            </View>
        </View>
    );
};

export const toastConfig = {
    success: ({ text1, text2 }) => <ToastCard tone="success" icon="checkmark-circle" text1={text1} text2={text2} />,
    error: ({ text1, text2 }) => <ToastCard tone="error" icon="alert-circle" text1={text1} text2={text2} />,
    info: ({ text1, text2 }) => <ToastCard tone="info" icon="information-circle" text1={text1} text2={text2} />,
};

export default toastConfig;
