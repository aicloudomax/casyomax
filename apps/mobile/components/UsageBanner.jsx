import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Banner showing daily usage limits at the top of feature screens.
 */
export const UsageBanner = ({ feature, remaining, plan }) => {
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

    if (plan === 'premium') return null;

    const limits = {
        ai_chat: 10,
        voice_chat: 5
    };

    const limit = limits[feature] || 0;
    const used = limit - remaining;

    // Determine colors based on remaining usage
    let bg = colors.primarySoft;
    let fg = colors.primary;
    if (remaining <= 0) {
        bg = colors.dangerSoft;
        fg = colors.danger;
    } else if (remaining <= 3) {
        bg = colors.warningSoft;
        fg = colors.warning;
    }

    return (
        <View style={[styles.container, { backgroundColor: bg, borderColor: fg }]}>
            <Ionicons name="information-circle-outline" size={18} color={fg} />
            <Text style={[styles.text, { color: fg }]}>
                {remaining > 0
                    ? `Usage today: ${used} / ${limit} ${feature === 'ai_chat' ? 'chats' : 'voice chats'}`
                    : `Daily limit reached (${limit}/${limit})`
                }
            </Text>
            {remaining > 0 && remaining <= 3 && (
                <Text style={[styles.warningText, { color: colors.warning }]}> Low remaining!</Text>
            )}
        </View>
    );
};

const makeStyles = (t) => {
    const f = t.fonts;
    const r = t.radius;
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderRadius: r.sm,
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 4,
        },
        text: {
            fontSize: 13,
            fontFamily: f.semibold,
            marginLeft: 8,
        },
        warningText: {
            fontSize: 11,
            fontFamily: f.regular,
            fontStyle: 'italic',
        }
    });
};
