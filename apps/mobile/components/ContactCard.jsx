import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

const ContactCard = ({ contact, onEdit, onDelete }) => {
    const handleDelete = () => {
        Alert.alert(
            "Delete Contact",
            `Are you sure you want to delete ${contact.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(contact.id) }
            ]
        );
    };

    return (
        <View style={styles.card}>
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{contact.name}</Text>
                <Text style={styles.detail}>{contact.email}</Text>
                {contact.relation && <Text style={styles.relation}>{contact.relation}</Text>}
            </View>

            <Menu>
                <MenuTrigger>
                    <Ionicons name="ellipsis-vertical" size={20} color="#666" style={styles.menuIcon} />
                </MenuTrigger>
                <MenuOptions containerStyle={styles.menuOptions}>
                    <MenuOption onSelect={() => onEdit(contact)} text='Edit' />
                    <MenuOption onSelect={handleDelete} >
                        <Text style={{ color: 'red' }}>Delete</Text>
                    </MenuOption>
                </MenuOptions>
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    detail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    relation: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 2,
    },
    menuIcon: {
        padding: 8,
    },
    menuOptions: {
        borderRadius: 8,
        padding: 4,
        marginTop: 30, // Adjust position if needed
    },
});

export default ContactCard;
