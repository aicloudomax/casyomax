import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ContactCard from '../../../components/ContactCard';

import { ENDPOINTS } from '../../../constants/ApiConstants';
import ApiHelper from '../../../services/ApiHelper';

const ContactsScreen = () => {
    const router = useRouter();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [relation, setRelation] = useState('');
    const [selectedContactId, setSelectedContactId] = useState(null);

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;

            if (!userId) return;

            // const response = await fetch(`${API_BASE_URL}/contacts/user/${userId}`);
            // Use ApiHelper
            const data = await ApiHelper.get(ENDPOINTS.CONTACTS.BY_USER(userId));

            if (data.success) {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load contacts' });
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchContacts();
        }, [fetchContacts])
    );

    const handleSave = async () => {
        if (!name || !email) {
            Alert.alert("Missing Fields", "Please enter a name and email.");
            return;
        }

        try {
            // const userId = await SecureStore.getItemAsync('user_id'); // Wrong key
            const userDataStr = await SecureStore.getItemAsync('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;

            if (!userId) {
                Alert.alert("Error", "User ID not found. Please log in again.");
                return;
            }

            const url = isEditing
                ? `${ENDPOINTS.CONTACTS.BASE}/${selectedContactId}`
                : ENDPOINTS.CONTACTS.BASE;

            console.log("Saving Contact Endpoint:", url);
            const payload = { userId, name, email, relation };

            let data;
            if (isEditing) {
                data = await ApiHelper.put(url, payload);
            } else {
                data = await ApiHelper.post(url, payload);
            }

            if (data.success) {
                Toast.show({ type: 'success', text1: isEditing ? 'Updated' : 'Added', text2: `Contact ${name} saved.` });
                setModalVisible(false);
                fetchContacts();
                resetForm();
            } else {
                Alert.alert("Error", data.message || "Failed to save contact.");
            }
        } catch (error) {
            console.error("Save error details:", error);
            Alert.alert("Save Error", `Failed to save: ${error.message || "Unknown error"}`);
        }
    };

    const confirmDelete = (id) => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this contact?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDelete(id) }
            ]
        );
    };

    const handleDelete = async (id) => {
        try {
            const data = await ApiHelper.delete(`${ENDPOINTS.CONTACTS.BASE}/${id}`);
            if (data.success) {
                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Contact removed.' });
                fetchContacts();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete.' });
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const openEdit = (contact) => {
        setIsEditing(true);
        setSelectedContactId(contact.id);
        setName(contact.name);
        setEmail(contact.email);
        setRelation(contact.relation || '');
        setModalVisible(true);
    };

    const openAdd = () => {
        setIsEditing(false);
        resetForm();
        setModalVisible(true);
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setRelation('');
        setSelectedContactId(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Contacts</Text>
                <TouchableOpacity onPress={openAdd} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#00796b" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ContactCard
                            contact={item}
                            onEdit={openEdit}
                            onDelete={confirmDelete} // Passing alert handler handled inside Card mostly, but we pass confirm logic
                        />
                    )}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No contacts found. Add some!</Text>
                    }
                />
            )}

            {/* Use ContactCard's internal delete logic or pass ID? 
                Actually ContactCard implemented Alert internally, but it calls onDelete(id).
                So we just pass handleDelete to it. Correct.
            */}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isEditing ? "Edit Contact" : "Add Contact"}</Text>

                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            placeholder="Enter name"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                        />
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            placeholder="Enter email"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Text style={styles.inputLabel}>Relationship</Text>
                        <TextInput
                            placeholder="e.g. Doctor, Friend"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={relation}
                            onChangeText={setRelation}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveText}>Save</Text>
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
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 50,
        backgroundColor: '#fff',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#00796b',
        padding: 8,
        borderRadius: 20,
    },
    list: {
        padding: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#00796b',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
        color: '#333',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        marginRight: 8,
        borderRadius: 8,
        backgroundColor: '#eee',
        alignItems: 'center',
    },
    saveBtn: {
        flex: 1,
        padding: 12,
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: '#00796b',
        alignItems: 'center',
    },
    cancelText: { color: '#333', fontWeight: '600' },
    saveText: { color: '#fff', fontWeight: '600' },
});

export default ContactsScreen;
