import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

/**
 * Status pill / badge.
 * tone: primary | success | warning | danger | neutral
 * dot: show a leading status dot.
 */
export function Badge({ label, tone = 'neutral', dot = false, style }) {
    const { colors, radius, spacing } = useTheme();

    const tones = {
        primary: { bg: colors.primarySoft, fg: colors.primary },
        success: { bg: colors.successSoft, fg: colors.success },
        warning: { bg: colors.warningSoft, fg: colors.warning },
        danger: { bg: colors.dangerSoft, fg: colors.danger },
        neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
    };
    const t = tones[tone] || tones.neutral;

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    alignSelf: 'flex-start',
                    backgroundColor: t.bg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                },
                style,
            ]}
        >
            {dot ? (
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.fg }} />
            ) : null}
            <AppText variant="caption" weight="semibold" style={{ color: t.fg }}>
                {label}
            </AppText>
        </View>
    );
}

export default Badge;
