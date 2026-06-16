import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';

const ForgotPasswordScreen = () => {
    const router = useRouter();
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter your email address.'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await ApiHelper.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });

            if (response.success) {
                Toast.show({
                    type: 'success',
                    text1: 'OTP Sent!',
                    text2: 'Check your email for the reset code.'
                });
                // Navigate to reset password screen with email
                router.push({
                    pathname: '/auth/reset-password',
                    params: { email }
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to send OTP. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="lock-reset" size={48} color={colors.primary} />
                </View>
                <AppText variant="display" style={styles.title}>Forgot Password?</AppText>
                <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                    Enter your email address and we'll send you a verification code to reset your password.
                </AppText>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <AppText variant="label" style={styles.label}>Email Address</AppText>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>
                </View>

                <Button
                    title="Send Verification Code"
                    onPress={handleSendOTP}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="lg"
                />

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
                    <AppText variant="body" color="primary" style={styles.backButtonText}>Back to Login</AppText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    const f = t.fonts;
    const sh = t.shadows;
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
            justifyContent: 'center',
            padding: 20,
        },
        logoContainer: {
            alignItems: 'center',
            marginBottom: 40,
        },
        iconCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: c.primarySoft,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
        },
        title: {
            marginBottom: 12,
        },
        subtitle: {
            textAlign: 'center',
            paddingHorizontal: 20,
        },
        formContainer: {
            backgroundColor: c.surface,
            borderRadius: r.lg,
            padding: 24,
            borderWidth: 1,
            borderColor: c.border,
            ...sh.md,
        },
        inputContainer: {
            marginBottom: 24,
        },
        label: {
            marginBottom: 8,
            color: c.text,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceSunken,
            borderRadius: r.md,
            borderWidth: 1,
            borderColor: c.border,
        },
        inputIcon: {
            paddingLeft: 16,
        },
        input: {
            flex: 1,
            padding: 16,
            fontSize: 16,
            color: c.text,
            fontFamily: f.regular,
        },
        backButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
        },
        backButtonText: {
            marginLeft: 8,
        },
    });
};

export default ForgotPasswordScreen;
