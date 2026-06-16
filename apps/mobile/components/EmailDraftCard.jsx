import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

const EmailDraftCard = ({ recipientName, recipientEmail, subject, initialBody, onAction }) => {
    const [body, setBody] = useState(initialBody || "");
    const [sending, setSending] = useState(false);

    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

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
                <AppText variant="subtitle" weight="bold" style={{ color: '#00796b' }}>📧 Draft Email</AppText>
            </LinearGradient>

            <View style={styles.content}>
                <AppText variant="caption" color="textMuted" style={styles.label}>To:</AppText>
                <AppText variant="body" weight="medium" style={styles.value}>{recipientName} ({recipientEmail})</AppText>

                <AppText variant="caption" color="textMuted" style={styles.label}>Subject:</AppText>
                <AppText variant="body" weight="medium" style={styles.value}>{subject}</AppText>

                <AppText variant="caption" color="textMuted" style={styles.label}>Body:</AppText>
                <TextInput
                    style={styles.input}
                    multiline
                    value={body}
                    onChangeText={setBody}
                    textAlignVertical="top"
                    placeholderTextColor={colors.textMuted}
                />

                <View style={styles.actions}>
                    <Button
                        title="Discard"
                        variant="secondary"
                        size="sm"
                        onPress={handleCancel}
                        disabled={sending}
                    />
                    <Button
                        title="Send Email"
                        variant="primary"
                        size="sm"
                        onPress={handleSend}
                        disabled={sending}
                        loading={sending}
                    />
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
            backgroundColor: c.surface,
            borderRadius: r.lg,
            overflow: 'hidden',
            marginVertical: 10,
            width: '90%',
            alignSelf: 'center',
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
        },
        header: {
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
        },
        content: {
            padding: 16,
        },
        label: {
            marginTop: 8,
        },
        value: {
            color: c.text,
            marginBottom: 4,
        },
        input: {
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: r.md,
            padding: 10,
            height: 120,
            marginTop: 8,
            marginBottom: 16,
            backgroundColor: c.surfaceSunken,
            fontSize: 14,
            color: c.text,
            fontFamily: f.regular,
        },
        actions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 12,
        },
    });
};

export default EmailDraftCard;
