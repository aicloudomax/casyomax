import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { Alert } from '@/services/CrossPlatformAlert';
import { useCallback, useState } from 'react';
import { FlatList, Modal, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import ContactCard from '../../../components/ContactCard';
import SkeletonLoader from '../../../components/SkeletonLoader';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { IconButton } from '../../../components/ui/IconButton';
import { ENDPOINTS } from '../../../constants/ApiConstants';
import ApiHelper from '../../../services/ApiHelper';
import { useTheme } from '../../../theme/ThemeProvider';

const ContactsScreen = () => {
    const { colors, spacing, radius, fonts } = useTheme();
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

    const fetchContacts = useCallback(async ({ silent = false } = {}) => {
        // silent refresh avoids dropping to the full-page skeleton on in-place updates.
        if (!silent) setLoading(true);
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;
            if (!userId) return;
            const data = await ApiHelper.get(ENDPOINTS.CONTACTS.BY_USER(userId));
            if (data.success) {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load contacts' });
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchContacts();
        }, [fetchContacts])
    );

    const handleSave = async () => {
        if (!name || !email) {
            Alert.alert('Missing Fields', 'Please enter a name and email.');
            return;
        }
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;
            if (!userId) {
                Alert.alert('Error', 'User ID not found. Please log in again.');
                return;
            }
            const url = isEditing
                ? `${ENDPOINTS.CONTACTS.BASE}/${selectedContactId}`
                : ENDPOINTS.CONTACTS.BASE;
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
                fetchContacts({ silent: true });
                resetForm();
            } else {
                Alert.alert('Error', data.message || 'Failed to save contact.');
            }
        } catch (error) {
            console.error('Save error details:', error);
            Alert.alert('Save Error', `Failed to save: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            const data = await ApiHelper.delete(`${ENDPOINTS.CONTACTS.BASE}/${id}`);
            if (data.success) {
                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Contact removed.' });
                setContacts((prev) => prev.filter((c) => c.id !== id));
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete.' });
            }
        } catch (error) {
            console.error('Delete error:', error);
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

    const inputStyle = {
        backgroundColor: colors.surfaceSunken,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        color: colors.text,
        fontFamily: fonts.regular,
        fontSize: 16,
    };

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                }}
            >
                <IconButton icon="arrow-back" variant="soft" onPress={() => router.back()} />
                <AppText variant="title">My Contacts</AppText>
                <IconButton icon="add" variant="solid" onPress={openAdd} />
            </View>

            {loading ? (
                <View style={{ padding: spacing.lg }}>
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonLoader key={i} width="100%" height={84} borderRadius={radius.lg} style={{ marginBottom: spacing.md }} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ContactCard contact={item} onEdit={openEdit} onDelete={handleDelete} />
                    )}
                    contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: spacing.xxxl, paddingHorizontal: spacing.xl }}>
                            <View
                                style={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: 48,
                                    backgroundColor: colors.primarySoft,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: spacing.lg,
                                }}
                            >
                                <Ionicons name="people-outline" size={44} color={colors.primary} />
                            </View>
                            <AppText variant="title">No contacts yet</AppText>
                            <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: spacing.xs, maxWidth: 280 }}>
                                Add emergency or care contacts so they can be reached quickly.
                            </AppText>
                            <Button title="Add contact" icon="add" onPress={openAdd} style={{ marginTop: spacing.lg }} />
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl }}>
                    <Card elevation="lg">
                        <AppText variant="title" align="center" style={{ marginBottom: spacing.lg }}>
                            {isEditing ? 'Edit contact' : 'Add contact'}
                        </AppText>

                        <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>Full name</AppText>
                        <TextInput placeholder="Enter name" placeholderTextColor={colors.textMuted} style={inputStyle} value={name} onChangeText={setName} />

                        <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>Email</AppText>
                        <TextInput
                            placeholder="Enter email"
                            placeholderTextColor={colors.textMuted}
                            style={inputStyle}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>Relationship</AppText>
                        <TextInput placeholder="e.g. Doctor, Friend" placeholderTextColor={colors.textMuted} style={inputStyle} value={relation} onChangeText={setRelation} />

                        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                            <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, justifyContent: 'center' }} />
                            <Button title="Save" onPress={handleSave} style={{ flex: 1, justifyContent: 'center' }} />
                        </View>
                    </Card>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default ContactsScreen;
