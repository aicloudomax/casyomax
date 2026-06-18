import * as SecureStore from '@/services/SecureStore';
import { Alert } from '@/services/CrossPlatformAlert';
import { useEffect, useState } from 'react';
import { Modal, TextInput, View } from 'react-native';
import { ENDPOINTS } from '../constants/ApiConstants';
import ApiHelper from '../services/ApiHelper';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

/**
 * Shared edit-profile modal (used by patient / caretaker / admin profiles).
 * Updates first name, last name, and phone via PUT /users/:id, refreshes
 * SecureStore, and calls onSaved(updatedUser).
 */
export function EditProfileModal({ visible, user, onClose, onSaved }) {
    const { colors, spacing, radius, fonts } = useTheme();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible && user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setPhone(user.phone || '');
        }
    }, [visible, user]);

    const handleSave = async () => {
        if (!firstName.trim()) {
            Alert.alert('Error', 'Please enter your first name.');
            return;
        }
        setSaving(true);
        try {
            const res = await ApiHelper.put(`${ENDPOINTS.USERS}/${user.id}`, {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim(),
            });
            if (res.success && res.user) {
                await SecureStore.setItemAsync('userData', JSON.stringify(res.user));
                onSaved?.(res.user);
                onClose?.();
            } else {
                Alert.alert('Error', res.message || 'Could not update your profile.');
            }
        } catch (e) {
            Alert.alert('Error', e.message || 'Could not update your profile.');
        } finally {
            setSaving(false);
        }
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
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl }}>
                <Card elevation="lg">
                    <AppText variant="title" align="center" style={{ marginBottom: spacing.lg }}>Edit profile</AppText>

                    <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>First name</AppText>
                    <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.textMuted} style={inputStyle} />

                    <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>Last name</AppText>
                    <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={colors.textMuted} style={inputStyle} />

                    <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>Phone</AppText>
                    <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" style={inputStyle} />

                    <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                        <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1, justifyContent: 'center' }} />
                        <Button title={saving ? 'Saving…' : 'Save'} loading={saving} onPress={handleSave} style={{ flex: 1, justifyContent: 'center' }} />
                    </View>
                </Card>
            </View>
        </Modal>
    );
}

export default EditProfileModal;
