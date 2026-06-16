import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { usePlan } from '../../hooks/usePlan';
import { useTheme } from '../../theme/ThemeProvider';

export default function PlanScreen() {
    const { plan } = usePlan();
    const { colors, spacing, radius } = useTheme();
    const isPremium = plan === 'premium';

    const features = [
        { name: 'AI Health Assistant', free: '10 chats / day', premium: 'Unlimited' },
        { name: 'Voice Commands', free: '5 chats / day', premium: 'Unlimited' },
        { name: 'Email Sending', free: 'Not included', premium: 'Included' },
        { name: 'Email Scheduling', free: 'Not included', premium: 'Included' },
        { name: 'Caretaker Collaboration', free: 'Included', premium: 'Included' },
    ];

    return (
        <Screen scroll edges={['left', 'right']} contentContainerStyle={{ paddingTop: spacing.lg }}>
            {/* Gradient hero */}
            <LinearGradient
                colors={isPremium ? ['#F59E0B', '#EF4444'] : [colors.primary, colors.accentViolet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    borderRadius: radius.xl,
                    padding: spacing.xl,
                    alignItems: 'center',
                    ...{
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 8,
                    },
                }}
            >
                <View
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: spacing.md,
                    }}
                >
                    <Ionicons name={isPremium ? 'star' : 'person'} size={32} color="#FFFFFF" />
                </View>
                <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>CURRENT PLAN</AppText>
                <AppText variant="displayLg" style={{ color: '#FFFFFF', marginTop: 2 }}>
                    {plan.toUpperCase()}
                </AppText>
                <AppText variant="body" align="center" style={{ color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs }}>
                    {isPremium
                        ? 'You have full access to all Casyomax features.'
                        : 'You are using the basic version of Casyomax.'}
                </AppText>
            </LinearGradient>

            {/* Feature comparison */}
            <AppText variant="title" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
                Feature comparison
            </AppText>

            {features.map((f, i) => (
                <Card key={i} style={{ marginBottom: spacing.md }}>
                    <AppText variant="subtitle">{f.name}</AppText>
                    <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: colors.surfaceAlt,
                                borderRadius: radius.md,
                                padding: spacing.md,
                            }}
                        >
                            <AppText variant="caption" color="textMuted">FREE</AppText>
                            <AppText variant="body" weight="medium" style={{ marginTop: 2 }}>{f.free}</AppText>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: colors.primarySoft,
                                borderRadius: radius.md,
                                padding: spacing.md,
                                borderWidth: 1,
                                borderColor: colors.primaryBorder,
                            }}
                        >
                            <AppText variant="caption" color="primary">PREMIUM</AppText>
                            <AppText variant="body" weight="semibold" color="primary" style={{ marginTop: 2 }}>
                                {f.premium}
                            </AppText>
                        </View>
                    </View>
                </Card>
            ))}

            {/* Info note */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    marginTop: spacing.sm,
                }}
            >
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" color="primary">Premium</AppText>
                    <AppText variant="body" color="textSecondary" style={{ marginTop: 2 }}>
                        Premium features are coming soon.
                    </AppText>
                </View>
            </View>
        </Screen>
    );
}
