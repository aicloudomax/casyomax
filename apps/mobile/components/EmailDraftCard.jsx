import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const EmailDraftCard = ({ recipientName, recipientEmail, subject, initialBody, onAction }) => {
    const [body, setBody] = useState(initialBody || "");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        await onAction('send', { recipientName, recipientEmail, subject, body });
        setSending(false);
    };

    const handleCancel = () => {
        onAction('cancel');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#e0f7fa', '#ffffff']}
                style={styles.header}
            >
                <Text style={styles.title}>📧 Draft Email</Text>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.label}>To:</Text>
                <Text style={styles.value}>{recipientName} ({recipientEmail})</Text>

                <Text style={styles.label}>Subject:</Text>
                <Text style={styles.value}>{subject}</Text>

                <Text style={styles.label}>Body:</Text>
                <TextInput
                    style={styles.input}
                    multiline
                    value={body}
                    onChangeText={setBody}
                    textAlignVertical="top"
                />

                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} disabled={sending}>
                        <Text style={styles.cancelText}>Discard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={handleSend} disabled={sending}>
                        {sending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.sendText}>Send Email</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 10,
        width: '90%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 4,
    },
    header: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00796b',
    },
    content: {
        padding: 16,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
    },
    value: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        height: 120,
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: '#fafafa',
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    sendButton: {
        backgroundColor: '#007bff',
    },
    cancelText: {
        color: '#666',
        fontWeight: '600',
    },
    sendText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default EmailDraftCard;
