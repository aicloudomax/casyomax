import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Alert } from '@/services/CrossPlatformAlert';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

const ContactCard = ({ contact, onEdit, onDelete }) => {
    const { colors, radius, spacing, fonts } = useTheme();

    const handleDelete = () => {
        Alert.alert(
            'Delete Contact',
            `Are you sure you want to delete ${contact.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(contact.id) },
            ]
        );
    };

    return (
        <Card style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={contact.name} size={48} />
                <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" numberOfLines={1}>{contact.name}</AppText>
                    <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
                        {contact.email}
                    </AppText>
                    {contact.relation ? (
                        <Badge tone="neutral" label={contact.relation} style={{ marginTop: spacing.sm }} />
                    ) : null}
                </View>

                <Menu>
                    <MenuTrigger>
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} style={{ padding: 8 }} />
                    </MenuTrigger>
                    <MenuOptions
                        customStyles={{
                            optionsContainer: {
                                backgroundColor: colors.surface,
                                borderRadius: radius.md,
                                padding: 4,
                                borderWidth: 1,
                                borderColor: colors.border,
                            },
                            optionText: { color: colors.text, fontFamily: fonts.medium },
                        }}
                    >
                        <MenuOption onSelect={() => onEdit(contact)} text="Edit" />
                        <MenuOption onSelect={handleDelete}>
                            <AppText style={{ color: colors.danger }} weight="semibold">Delete</AppText>
                        </MenuOption>
                    </MenuOptions>
                </Menu>
            </View>
        </Card>
    );
};

export default ContactCard;
