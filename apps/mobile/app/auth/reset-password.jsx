import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';

const ResetPasswordScreen = () => {
    const router = useRouter();
    const { email } = useLocalSearchParams();
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!otp.trim() || otp.length !== 6) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Code',
                text2: 'Please enter the 6-digit verification code.'
            });
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Weak Password',
                text2: 'Password must be at least 6 characters.'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Mismatch',
                text2: 'Passwords do not match.'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await ApiHelper.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
                email,
                otp,
                newPassword
            });

            if (response.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Password Reset!',
                    text2: 'You can now login with your new password.'
                });
                router.replace('/login');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to reset password. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await ApiHelper.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
            if (response.success) {
                Toast.show({
                    type: 'success',
                    text1: 'OTP Resent!',
                    text2: 'Check your email for the new code.'
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to resend OTP.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="shield-key" size={48} color={colors.primary} />
                </View>
                <AppText variant="display" style={styles.title}>Reset Password</AppText>
                <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                    Enter the 6-digit code sent to {email || 'your email'} and create your new password.
                </AppText>
            </View>

            <View style={styles.formContainer}>
                {/* OTP Input */}
                <View style={styles.inputContainer}>
                    <AppText variant="label" style={styles.label}>Verification Code</AppText>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="numeric" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit code"
                            placeholderTextColor={colors.textMuted}
                            value={otp}
                            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!loading}
                        />
                    </View>
                </View>

                {/* New Password Input */}
                <View style={styles.inputContainer}>
                    <AppText variant="label" style={styles.label}>New Password</AppText>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor={colors.textMuted}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <MaterialCommunityIcons
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={22}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                    <AppText variant="label" style={styles.label}>Confirm Password</AppText>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor={colors.textMuted}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <MaterialCommunityIcons
                                name={showConfirmPassword ? 'eye-off' : 'eye'}
                                size={22}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Button
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="lg"
                    style={styles.resetButton}
                />

                <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendOTP}
                    disabled={loading}
                >
                    <AppText variant="body" color="primary">Didn't receive code? Resend</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/login')}
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
            marginBottom: 32,
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
            marginBottom: 20,
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
        eyeButton: {
            padding: 12,
        },
        resetButton: {
            marginTop: 8,
        },
        resendButton: {
            alignItems: 'center',
            marginTop: 16,
        },
        backButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
        },
        backButtonText: {
            marginLeft: 8,
        },
    });
};

export default ResetPasswordScreen;
