import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { login } from '../../services/AuthService';

export default function RegisterScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Patient', // Default role
    });

    const roles = ['Patient', 'Caregiver', 'Guardian']; // Exclude Admin for public registration? Or allow? Assuming mainly public roles.

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
                    // Handle both terminologies if unsure, assuming 'caregiver' from previous context but login uses 'caretaker'
                    // Let's check ROLES constant in next step if possible, but safe to check string.
                    // Login checks ROLES.CARETAKER.
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
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started with Casyomax</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Name Fields Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>First Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John"
                                    value={formData.first_name}
                                    onChangeText={(text) => handleChange('first_name', text)}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Last Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Doe"
                                    value={formData.last_name}
                                    onChangeText={(text) => handleChange('last_name', text)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="john.doe@example.com"
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 8900"
                                value={formData.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="********"
                                value={formData.password}
                                onChangeText={(text) => handleChange('password', text)}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>I am a...</Text>
                            <View style={styles.roleContainer}>
                                {roles.map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[
                                            styles.roleButton,
                                            formData.role === r && styles.roleButtonActive
                                        ]}
                                        onPress={() => handleChange('role', r)}
                                    >
                                        <Text style={[
                                            styles.roleText,
                                            formData.role === r && styles.roleTextActive
                                        ]}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <Text style={styles.linkText}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
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
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#F5F7FA',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    roleButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F5F7FA',
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    roleButtonActive: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    roleText: {
        color: '#666',
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#FFF',
    },
    button: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
