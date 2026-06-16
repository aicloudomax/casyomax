import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { useMemo, useState } from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/services/CrossPlatformAlert';
import { ENDPOINTS, ROLES } from '../constants/ApiConstants';
import ApiHelper from '../services/ApiHelper';
import { registerForPushNotificationsAsync, registerTokenWithBackend } from '../services/notifications';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from '../components/ui/AppText';
import { Button } from '../components/ui/Button';

const LoginScreen = () => {
    const router = useRouter();
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await ApiHelper.post(ENDPOINTS.LOGIN, { email, password });
            console.log(response);

            // Store token and user data
            await SecureStore.setItemAsync('userToken', response.token);
            await SecureStore.setItemAsync('userData', JSON.stringify(response.user));

            // Register for push notifications
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await registerTokenWithBackend(token);
            }

            // Redirect based on role
            const role = response.user.role;
            if (role === ROLES.ADMIN) {
                router.replace('/admin/home');
            } else if (role === ROLES.CAREGIVER) {
                router.replace('/caretaker/home');
            } else if (role === ROLES.PATIENT) {
                router.replace('/patient/home');
            } else {
                Alert.alert('Error', 'Unknown user role.');
            }
        } catch (error) {
            Alert.alert('Login Failed', error.message || 'An error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.logoWrapper}>
                    <Image source={require('../assets/images/icon.jpg')} style={styles.appLogo} resizeMode="contain" />
                </View>
                <AppText variant="titleLg" style={styles.brand}>Casyomax</AppText>
                <AppText variant="bodyLg" color="textSecondary" style={styles.subtitle}>Welcome Back</AppText>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <AppText variant="label" style={styles.label}>Email</AppText>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <AppText variant="label" style={styles.label}>Password</AppText>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <MaterialCommunityIcons
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Button
                    title="Login"
                    onPress={handleLogin}
                    loading={loading}
                    fullWidth
                    size="lg"
                    style={styles.loginButton}
                />

                <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => router.push('/auth/forgot-password')}
                >
                    <AppText variant="body" color="primary">Forgot Password?</AppText>
                </TouchableOpacity>

                <View style={styles.registerContainer}>
                    <AppText variant="body" color="textSecondary">Don't have an account? </AppText>
                    <TouchableOpacity onPress={() => router.push('/auth/register')}>
                        <AppText variant="body" color="primary" weight="bold">Register</AppText>
                    </TouchableOpacity>
                </View>
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
        logoWrapper: {
            marginBottom: 16,
            backgroundColor: c.surface,
            borderRadius: r.xl,
            padding: 4,
            ...sh.md,
        },
        appLogo: {
            width: 120,
            height: 120,
            borderRadius: r.lg,
        },
        brand: {
            marginTop: 4,
        },
        subtitle: {
            marginTop: 4,
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
        input: {
            backgroundColor: c.surfaceSunken,
            borderRadius: r.md,
            padding: 16,
            fontSize: 16,
            color: c.text,
            fontFamily: f.regular,
            borderWidth: 1,
            borderColor: c.border,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceSunken,
            borderRadius: r.md,
            borderWidth: 1,
            borderColor: c.border,
        },
        passwordInput: {
            flex: 1,
            padding: 16,
            fontSize: 16,
            color: c.text,
            fontFamily: f.regular,
        },
        eyeButton: {
            padding: 12,
        },
        loginButton: {
            marginTop: 8,
        },
        forgotPassword: {
            alignItems: 'center',
            marginTop: 16,
        },
        registerContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
        },
    });
};

export default LoginScreen;
