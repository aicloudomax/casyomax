import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { deleteAccount, logoutUser } from '../../services/AuthService';

const CaretakerProfileScreen = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        const result = await deleteAccount();
                        setLoading(false);
                        if (!result.success) {
                            Alert.alert("Error", result.message);
                        }
                    }
                }
            ]
        );
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


            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
                <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
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
});

export default CaretakerProfileScreen;
