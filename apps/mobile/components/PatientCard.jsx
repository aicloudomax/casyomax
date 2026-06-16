import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

const getAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const PatientCard = ({ patient, onPress }) => {
    const { colors, spacing } = useTheme();
    const age = getAge(patient.date_of_birth);
    const hasMed = !!patient.next_medication;
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const meta = [age != null ? `Age ${age}` : null, patient.relation].filter(Boolean).join(' · ');

    return (
        <Card onPress={onPress} elevation="sm" style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar uri={patient.profile_image_url} name={fullName} size={52} />
                <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" numberOfLines={1}>
                        {fullName || 'Unknown patient'}
                    </AppText>
                    {meta ? (
                        <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                            {meta}
                        </AppText>
                    ) : null}
                    <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
                        {hasMed ? (
                            <Badge tone="primary" dot label={`Next dose · ${patient.next_medication}`} />
                        ) : (
                            <Badge tone="neutral" label="No upcoming doses" />
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
        </Card>
    );
};

export default PatientCard;
