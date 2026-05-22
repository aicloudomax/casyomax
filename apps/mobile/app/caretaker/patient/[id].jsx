import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import EmptyStateCard from '../../../components/EmptyStateCard';
import SkeletonLoader from '../../../components/SkeletonLoader';
import { ENDPOINTS } from '../../../constants/ApiConstants';
import ApiHelper from '../../../services/ApiHelper';

import CustomTimePicker from '../../../components/CustomTimePicker';

const PatientDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Medication');
    const [patient, setPatient] = useState(null);
    const [medications, setMedications] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [addMedModalVisible, setAddMedModalVisible] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [newMedication, setNewMedication] = useState({
        medicine_name: '',
        dosage: '',
        form: '',
        instructions: ''
    });
    const [selectedSchedule, setSelectedSchedule] = useState(null); // For Edit
    const [sortByActive, setSortByActive] = useState(true);
    const [addScheduleModalVisible, setAddScheduleModalVisible] = useState(false);
    const [userId, setUserId] = useState(null);
    const [newSchedule, setNewSchedule] = useState({
        medication_id: '',
        time_of_day: '',
        schedule_type: 'daily',
        days_of_week: [0, 1, 2, 3, 4, 5, 6]
    });
    const [medicationPickerVisible, setMedicationPickerVisible] = useState(false);

    useEffect(() => {
        fetchData();
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        const userDataStr = await SecureStore.getItemAsync('userData');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            setUserId(userData.id);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientRes, medRes, scheduleRes, historyRes] = await Promise.all([
                ApiHelper.get(`${ENDPOINTS.PATIENTS}/${id}`),
                ApiHelper.get(`${ENDPOINTS.MEDICATIONS.BASE}/${id}`),
                ApiHelper.get(`${ENDPOINTS.MEDICATIONS.SCHEDULES_BY_PATIENT}/${id}`),
                ApiHelper.get(`${ENDPOINTS.MEDICATIONS.LOGS_BY_PATIENT}/${id}`)
            ]);

            if (patientRes.success) setPatient(patientRes.patient);
            if (medRes.success) setMedications(medRes.data);
            if (Array.isArray(scheduleRes)) setSchedules(scheduleRes);
            if (historyRes.success) setHistory(historyRes.history);

        } catch (error) {
            console.error("Error fetching data:", error);
            Alert.alert("Error", "Failed to load patient data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async () => {
        if (!newSchedule.medication_id || !newSchedule.time_of_day) {
            Alert.alert("Error", "Please select a medication and time.");
            return;
        }

        // Validate time format HH:MM
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(newSchedule.time_of_day)) {
            Alert.alert("Error", "Invalid time format. Use HH:MM (24-hour).");
            return;
        }

        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const payload = {
                ...newSchedule,
                created_by: userId,
                start_date: new Date().toISOString().split('T')[0], // Today
                timezone: timezone
            };
            await ApiHelper.post(ENDPOINTS.MEDICATIONS.SCHEDULES, payload);
            setAddScheduleModalVisible(false);
            setNewSchedule({
                medication_id: '',
                time_of_day: '',
                schedule_type: 'daily',
                days_of_week: [0, 1, 2, 3, 4, 5, 6]
            });
            fetchData(); // Refresh
            Alert.alert("Success", "Schedule added successfully.");
        } catch (error) {
            console.error("Error adding schedule:", error);
            Alert.alert("Error", "Failed to add schedule.");
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        Alert.alert(
            "Delete Schedule",
            "Are you sure you want to delete this medication schedule?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ApiHelper.delete(`${ENDPOINTS.MEDICATIONS.SCHEDULES}/${scheduleId}`);
                            fetchData(); // Refresh
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete schedule.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteMedication = async (medicationId) => {
        Alert.alert(
            "Delete Medication",
            "Are you sure you want to delete this medication?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ApiHelper.delete(`${ENDPOINTS.MEDICATIONS.BASE}/${medicationId}`);
                            fetchData(); // Refresh
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete medication.");
                        }
                    }
                }
            ]
        );
    };

    const handleAddMedication = async () => {
        if (!newMedication.medicine_name || !newMedication.dosage) {
            Alert.alert("Error", "Please fill in at least the Medicine Name and Dosage.");
            return;
        }

        try {
            const payload = {
                patient_id: id,
                ...newMedication
            };
            await ApiHelper.post(ENDPOINTS.MEDICATIONS.BASE, payload);
            setAddMedModalVisible(false);
            setNewMedication({ medicine_name: '', dosage: '', form: '', instructions: '' });
            fetchData(); // Refresh
            Alert.alert("Success", "Medication added successfully.");
        } catch (error) {
            console.error("Error adding medication:", error);
            Alert.alert("Error", "Failed to add medication.");
        }
    };

    const handleToggleActive = async (medication) => {
        try {
            await ApiHelper.put(`${ENDPOINTS.MEDICATIONS.BASE}/${medication.id}`, { is_active: !medication.is_active });
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error toggling medication status:", error);
            Alert.alert("Error", "Failed to update medication status.");
        }
    };

    const getSortedMedications = () => {
        if (!sortByActive) return medications;
        return [...medications].sort((a, b) => {
            if (a.is_active === b.is_active) return 0;
            return a.is_active ? -1 : 1;
        });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            {patient && (
                <TouchableOpacity style={styles.profileInfo} onPress={() => setActiveTab('Details')}>
                    <Image
                        source={{ uri: patient.profile_image_url || `https://i.pravatar.cc/150?u=${id}` }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.name}>{patient.first_name} {patient.last_name}</Text>
                        <Text style={styles.age}>Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {['Medication', 'Schedule', 'History'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderMedicationItem = ({ item }) => (
        <View style={[styles.card, !item.is_active && styles.inactiveCard]}>
            <View style={styles.cardRow}>
                <View style={styles.medInfo}>
                    <Text style={[styles.medName, !item.is_active && styles.inactiveText]}>{item.medicine_name}</Text>
                    <Text style={styles.subText}>{item.dosage} • {item.form}</Text>
                    <Text style={styles.subText}>{item.instructions}</Text>
                </View>
                <View style={styles.actions}>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={item.is_active ? "#2D9CDB" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => handleToggleActive(item)}
                        value={item.is_active}
                    />
                    <TouchableOpacity onPress={() => handleDeleteMedication(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={20} color="#EB5757" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderScheduleItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={20} color="#333" />
                    <Text style={styles.timeText}>{item.time_of_day}</Text>
                </View>
                <View style={styles.medInfo}>
                    <Text style={styles.medName}>
                        {item.medicine_name} {item.dosage ? `(${item.dosage})` : ''}
                    </Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.schedule_type}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSchedule(item.id)}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHistoryItem = ({ item }) => {
        let statusColor = '#999';
        if (item.status === 'taken') statusColor = '#27AE60';
        if (item.status === 'missed') statusColor = '#EB5757';

        return (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
                <View style={styles.cardRow}>
                    <View>
                        <Text style={styles.medName}>{item.medicine_name}</Text>
                        <Text style={styles.subText}>{new Date(item.scheduled_at).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderDetails = () => (
        <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{patient?.email || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{patient?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{patient?.address || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medical Notes:</Text>
                <Text style={styles.detailValue}>{patient?.medical_notes || 'None'}</Text>
            </View>
        </View>
    );

    const renderAddMedicationModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={addMedModalVisible}
            onRequestClose={() => setAddMedModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add New Medication</Text>

                    <Text style={styles.label}>Medicine Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Paracetamol"
                        value={newMedication.medicine_name}
                        onChangeText={(text) => setNewMedication({ ...newMedication, medicine_name: text })}
                    />

                    <Text style={styles.label}>Dosage *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 500mg"
                        value={newMedication.dosage}
                        onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
                    />

                    <Text style={styles.label}>Form</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Tablet, Syrup"
                        value={newMedication.form}
                        onChangeText={(text) => setNewMedication({ ...newMedication, form: text })}
                    />

                    <Text style={styles.label}>Instructions</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Take after food"
                        value={newMedication.instructions}
                        onChangeText={(text) => setNewMedication({ ...newMedication, instructions: text })}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAddMedModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddMedication}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderAddScheduleModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={addScheduleModalVisible}
            onRequestClose={() => setAddScheduleModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add Schedule</Text>

                    <Text style={styles.label}>Medication *</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setMedicationPickerVisible(true)}
                    >
                        <Text style={styles.dropdownButtonText}>
                            {newSchedule.medication_id
                                ? medications.find(m => m.id === newSchedule.medication_id)?.medicine_name || 'Select Medication'
                                : 'Select Medication'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Frequency</Text>
                    <View style={styles.frequencyContainer}>
                        {['daily', 'specific_days', 'weekly'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.frequencyButton,
                                    newSchedule.schedule_type === type && styles.frequencyButtonActive
                                ]}
                                onPress={() => {
                                    setNewSchedule(prev => ({
                                        ...prev,
                                        schedule_type: type,
                                        days_of_week: type === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : type === 'weekly' ? [new Date().getDay()] : []
                                    }));
                                }}
                            >
                                <Text style={[
                                    styles.frequencyButtonText,
                                    newSchedule.schedule_type === type && styles.frequencyButtonTextActive
                                ]}>
                                    {type === 'specific_days' ? 'Specific' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {newSchedule.schedule_type !== 'daily' && (
                        <View style={styles.daysContainer}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                                const isSelected = newSchedule.days_of_week.includes(index);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                                        onPress={() => {
                                            setNewSchedule(prev => {
                                                if (prev.schedule_type === 'weekly') {
                                                    // Single select for weekly
                                                    return { ...prev, days_of_week: [index] };
                                                } else {
                                                    // Multi select for specific days
                                                    const days = prev.days_of_week.includes(index)
                                                        ? prev.days_of_week.filter(d => d !== index)
                                                        : [...prev.days_of_week, index];
                                                    return { ...prev, days_of_week: days.sort() };
                                                }
                                            });
                                        }}
                                    >
                                        <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextActive]}>{day}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <Text style={styles.label}>Time *</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.dropdownButtonText}>
                            {newSchedule.time_of_day ? (() => {
                                // Display in 12h format
                                const [h, m] = newSchedule.time_of_day.split(':');
                                let hour = parseInt(h, 10);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                if (hour > 12) hour -= 12;
                                if (hour === 0) hour = 12;
                                return `${hour}:${m} ${ampm}`;
                            })() : 'Select Time'}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    <CustomTimePicker
                        visible={showTimePicker}
                        onClose={() => setShowTimePicker(false)}
                        initialTime={newSchedule.time_of_day || '12:00'}
                        onSelect={(time) => setNewSchedule({ ...newSchedule, time_of_day: time })}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAddScheduleModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddSchedule}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Medication Picker Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={medicationPickerVisible}
                onRequestClose={() => setMedicationPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.modalTitle}>Select Medication</Text>
                        <FlatList
                            data={medications}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setNewSchedule({ ...newSchedule, medication_id: item.id });
                                        setMedicationPickerVisible(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemText}>{item.medicine_name} ({item.dosage})</Text>
                                    {newSchedule.medication_id === item.id && <Ionicons name="checkmark" size={20} color="#2D9CDB" />}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closePickerButton} onPress={() => setMedicationPickerVisible(false)}>
                            <Text style={styles.closePickerText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false, title: 'Patient Details' }} />
                <View style={styles.header}>
                    <SkeletonLoader width={24} height={24} style={{ marginRight: 16 }} />
                    <View style={styles.profileInfo}>
                        <SkeletonLoader width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
                        <View>
                            <SkeletonLoader width={120} height={20} style={{ marginBottom: 8 }} />
                            <SkeletonLoader width={60} height={16} />
                        </View>
                    </View>
                </View>
                <View style={styles.tabContainer}>
                    <SkeletonLoader width={100} height={30} style={{ flex: 1, marginRight: 4 }} />
                    <SkeletonLoader width={100} height={30} style={{ flex: 1, marginRight: 4 }} />
                    <SkeletonLoader width={100} height={30} style={{ flex: 1 }} />
                </View>
                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <SkeletonLoader width={100} height={24} />
                        <SkeletonLoader width={60} height={30} />
                    </View>
                    <View style={styles.list}>
                        {[1, 2].map((i) => (
                            <View key={i} style={{ marginBottom: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <SkeletonLoader width={150} height={20} style={{ marginBottom: 8 }} />
                                        <SkeletonLoader width={100} height={16} />
                                    </View>
                                    <SkeletonLoader width={24} height={24} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false, title: 'Patient Details' }} />
            {renderHeader()}
            {renderTabs()}

            <View style={styles.content}>
                {activeTab === 'Medication' && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Medications</Text>
                            <View style={styles.headerActions}>
                                <TouchableOpacity onPress={() => setSortByActive(!sortByActive)} style={styles.sortButton}>
                                    <Ionicons name="filter" size={20} color={sortByActive ? "#2D9CDB" : "#666"} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addButton} onPress={() => setAddMedModalVisible(true)}>
                                    <Ionicons name="add" size={20} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <FlatList
                            data={getSortedMedications()}
                            renderItem={renderMedicationItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={
                                <EmptyStateCard
                                    iconName="medkit-outline"
                                    message="No Medications"
                                    subMessage="Tap 'Add' to prescribe a new medication."
                                />
                            }
                        />
                    </>
                )}

                {activeTab === 'Schedule' && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Medication Schedule</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => setAddScheduleModalVisible(true)}>
                                <Ionicons name="add" size={20} color="#FFF" />
                                <Text style={styles.addButtonText}>Add Schedule</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={schedules}
                            renderItem={renderScheduleItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={
                                <EmptyStateCard
                                    iconName="calendar-outline"
                                    message="No Schedules"
                                    subMessage="No medication schedules set up yet."
                                />
                            }
                        />
                    </>
                )}

                {activeTab === 'History' && (
                    <FlatList
                        data={history}
                        renderItem={renderHistoryItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <EmptyStateCard
                                iconName="document-text-outline"
                                message="No History"
                                subMessage="No medication logs recorded yet."
                            />
                        }
                    />
                )}

                {activeTab === 'Details' && renderDetails()}
            </View>
            {renderAddMedicationModal()}
            {renderAddScheduleModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        paddingTop: 60, // For status bar
    },
    backButton: {
        marginRight: 16,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#E1E4E8',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    age: {
        fontSize: 14,
        color: '#666',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E1E4E8',
        padding: 4,
        margin: 16,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    tabText: {
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#333',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D9CDB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 4,
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    timeText: {
        marginLeft: 4,
        fontWeight: 'bold',
        color: '#333',
    },
    medInfo: {
        flex: 1,
    },
    medName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    badge: {
        backgroundColor: '#E1E4E8',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#555',
    },
    subText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    detailRow: {
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#888',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F4F8',
        marginRight: 10,
    },
    saveButton: {
        backgroundColor: '#2D9CDB',
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    inactiveCard: {
        opacity: 0.7,
        backgroundColor: '#F9FAFB',
    },
    inactiveText: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteBtn: {
        marginLeft: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sortButton: {
        padding: 8,
        marginRight: 8,
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#333',
    },
    pickerContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        elevation: 5,
        maxHeight: '80%',
        width: '100%',
    },
    pickerItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
    },
    closePickerButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    closePickerText: {
        color: '#EB5757',
        fontSize: 16,
        fontWeight: 'bold',
    },
    frequencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    frequencyButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    frequencyButtonActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2D9CDB',
    },
    frequencyButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    frequencyButtonTextActive: {
        color: '#2D9CDB',
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dayButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dayButtonActive: {
        backgroundColor: '#2D9CDB',
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    dayButtonTextActive: {
        color: '#FFF',
    },
});

export default PatientDetailsScreen;
