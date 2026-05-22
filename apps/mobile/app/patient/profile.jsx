import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { deleteAccount, logoutUser } from '../../services/AuthService';

const PatientProfileScreen = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                // Fetch fresh data from API
                const response = await ApiHelper.get(`${ENDPOINTS.USERS}/${userData.id}`);
                if (response.success) {
                    setUser(response.user);
                    // Update SecureStore with fresh data
                    await SecureStore.setItemAsync('userData', JSON.stringify(response.user));
                } else {
                    setUser(userData); // Fallback to cached data
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            Alert.alert("Error", "Failed to load profile data.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
    };

    const handleDeleteAccount = () => {
        setModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!password) {
            Alert.alert("Error", "Please enter your password.");
            return;
        }

        setDeleting(true);
        const result = await deleteAccount(password);
        setDeleting(false);
        setModalVisible(false);
        setPassword('');

        if (!result.success) {
            Alert.alert("Error", result.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <SkeletonLoader width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
                    <SkeletonLoader width={150} height={24} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width={80} height={16} />
                </View>
                <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <SkeletonLoader width={60} height={14} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width={200} height={16} />
                    </View>
                    <View style={styles.infoItem}>
                        <SkeletonLoader width={60} height={14} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width={150} height={16} />
                    </View>
                </View>
                <SkeletonLoader width="100%" height={50} borderRadius={12} style={{ marginBottom: 16 }} />
                <SkeletonLoader width="100%" height={50} borderRadius={12} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.center}>
                <Text>No user data found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {user.profile_image_url ? (
                    <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase()}
                        </Text>
                    </View>
                )}
                <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                <Text style={styles.role}>{user.role}</Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user.email}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{user.phone || 'N/A'}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/patient/medication-history')}>
                <Ionicons name="time-outline" size={20} color="#FFF" />
                <Text style={styles.historyButtonText}>Medication History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.historyButton, { backgroundColor: '#00796b', marginTop: -8 }]} onPress={() => router.push('/patient/contacts')}>
                <Ionicons name="people-outline" size={20} color="#FFF" />
                <Text style={styles.historyButtonText}>My Contacts</Text>
            </TouchableOpacity>


            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
                <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to delete your account? This action cannot be undone.
                            {"\n\n"}
                            Please enter your password to confirm.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#999"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setPassword('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmDelete}
                                disabled={deleting}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {deleting ? "Deleting..." : "Delete"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    role: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    infoSection: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    infoItem: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    historyButton: {
        backgroundColor: '#2D9CDB',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    historyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
    },
    logoutButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#FF3B30',
        marginBottom: 32, // Add some bottom margin for scroll
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F7FA',
    },
    confirmButton: {
        backgroundColor: '#FF3B30',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default PatientProfileScreen;
