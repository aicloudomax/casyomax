import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { login } from '../../services/AuthService';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';

export default function RegisterScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'patient', // Default role (value sent to backend)
    });

    // label = what the user sees, value = what the backend stores.
    // "Caretaker" is the display term; the backend role stays "caregiver".
    const roles = [
        { label: 'Patient', value: 'patient' },
        { label: 'Caretaker', value: 'caregiver' },
        { label: 'Guardian', value: 'guardian' },
    ];

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleRegister = async () => {
        const { first_name, last_name, email, phone, password, role } = formData;

        if (!first_name || !last_name || !email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Missing Fields',
                text2: 'Please fill in all required fields.',
                position: 'bottom'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await ApiHelper.post(ENDPOINTS.REGISTER, {
                first_name,
                last_name,
                email,
                phone,
                password,
                role: role.toLowerCase()
            });

            if (response.token) {
                await login(response.token, response.user);
                Toast.show({
                    type: 'success',
                    text1: 'Welcome!',
                    text2: 'Account created successfully.',
                    position: 'bottom'
                });

                // Redirect based on role (Same logic as Login)
                const userRole = response.user.role;
                if (userRole === 'admin') {
                    router.replace('/admin/home');
                } else if (userRole === 'caregiver' || userRole === 'caretaker') {
                    router.replace('/caretaker/home');
                } else if (userRole === 'patient') {
                    router.replace('/patient/home');
                } else {
                    // Fallback/Default
                    router.replace('/login');
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Registration Failed',
                    text2: response.message || "Could not create account.",
                    position: 'bottom'
                });
            }
        } catch (error) {
            console.log("Register Error:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || "An unexpected error occurred.",
                position: 'bottom'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <AppText variant="displayLg" style={styles.title}>Create Account</AppText>
                        <AppText variant="bodyLg" color="textSecondary">Sign up to get started with Casyomax</AppText>
                    </View>

                    <View style={styles.form}>
                        {/* Name Fields Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <AppText variant="label" style={styles.label}>First Name</AppText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.first_name}
                                    onChangeText={(text) => handleChange('first_name', text)}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <AppText variant="label" style={styles.label}>Last Name</AppText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Doe"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.last_name}
                                    onChangeText={(text) => handleChange('last_name', text)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText variant="label" style={styles.label}>Email</AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="john.doe@example.com"
                                placeholderTextColor={colors.textMuted}
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText variant="label" style={styles.label}>Phone (Optional)</AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 8900"
                                placeholderTextColor={colors.textMuted}
                                value={formData.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText variant="label" style={styles.label}>Password</AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="********"
                                placeholderTextColor={colors.textMuted}
                                value={formData.password}
                                onChangeText={(text) => handleChange('password', text)}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <AppText variant="label" style={styles.label}>I am a...</AppText>
                            <View style={styles.roleContainer}>
                                {roles.map((r) => (
                                    <TouchableOpacity
                                        key={r.value}
                                        style={[
                                            styles.roleButton,
                                            formData.role === r.value && styles.roleButtonActive
                                        ]}
                                        onPress={() => handleChange('role', r.value)}
                                    >
                                        <AppText
                                            variant="label"
                                            style={[
                                                styles.roleText,
                                                formData.role === r.value && styles.roleTextActive
                                            ]}
                                        >{r.label}</AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Button
                            title="Sign Up"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            fullWidth
                            size="lg"
                            style={styles.button}
                        />

                        <View style={styles.footer}>
                            <AppText variant="body" color="textSecondary">Already have an account? </AppText>
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <AppText variant="body" color="primary" weight="bold">Log In</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    const f = t.fonts;
    const sh = t.shadows;
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
        },
        scrollContent: {
            padding: 24,
            paddingBottom: 40,
        },
        backButton: {
            marginBottom: 20,
        },
        header: {
            marginBottom: 32,
        },
        title: {
            marginBottom: 8,
        },
        label: {
            marginBottom: 4,
            color: c.text,
        },
        form: {
            gap: 20,
        },
        row: {
            flexDirection: 'row',
        },
        inputGroup: {
            gap: 8,
        },
        input: {
            backgroundColor: c.surface,
            padding: 16,
            borderRadius: r.md,
            fontSize: 16,
            color: c.text,
            fontFamily: f.regular,
            borderWidth: 1,
            borderColor: c.border,
        },
        roleContainer: {
            flexDirection: 'row',
            gap: 10,
        },
        roleButton: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: r.pill,
            backgroundColor: c.surfaceAlt,
            borderWidth: 1,
            borderColor: c.border,
        },
        roleButtonActive: {
            backgroundColor: c.primary,
            borderColor: c.primary,
        },
        roleText: {
            color: c.textSecondary,
        },
        roleTextActive: {
            color: c.textOnPrimary,
        },
        button: {
            marginTop: 10,
            ...sh.sm,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
        },
    });
};
