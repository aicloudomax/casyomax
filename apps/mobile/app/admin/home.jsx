import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/services/CrossPlatformAlert';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Avatar } from '../../components/ui/Avatar';
import { ENDPOINTS, ROLES } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { getCurrentUser } from '../../services/AuthService';
import { useTheme } from '../../theme/ThemeProvider';

// --- Stats Config (values are dynamic) ---
const STATS_CONFIG = [
    { id: '1', key: 'totalUsers', title: 'Total Users', icon: 'people-outline', color: '#4A90E2' },
    { id: '2', key: 'activePatients', title: 'Active Patients', icon: 'pulse-outline', color: '#27AE60' },
    { id: '3', key: 'caretakers', title: 'Caretakers', icon: 'medkit-outline', color: '#F2994A' },
    { id: '4', key: 'pendingInvites', title: 'Pending Invites', icon: 'mail-open-outline', color: '#EB5757' },
];



const SUBS = [
    {
        id: '1',
        name: 'Dr. Evelyn Reed',
        email: 'evelyn@clinic.com',
        avatarText: 'ER',
        status: 'Active',
        statusColor: '#27AE60',
        image: null,
        startDate: 'Oct 9, 24',
        endDate: 'Oct 9, 26',
        mrr: '$50',
    },
    {
        id: '2',
        name: 'Barbara Williams',
        email: 'barbara@email.com',
        avatarText: 'BW',
        image: null,
        status: 'Trial',
        statusColor: '#F2994A',
        startDate: 'Nov 29, 25',
        endDate: 'Dec 29, 25',
        mrr: '$0',
    },
    {
        id: '3',
        name: 'Admin User',
        email: 'admin@pillpal.com',
        avatarText: 'AD',
        image: null,
        status: 'Active',
        statusColor: '#27AE60',
        startDate: 'Dec 9, 23',
        endDate: 'Lifetime',
        mrr: '$100',
    },
];

const TABS = ['All Users', 'Invites'/*, 'Subs'*/];
const FILTER_TABS = ['All', 'Patient', 'Caretaker'];

// New Constants for Dropdown
const USER_ROLES = ['Patient', 'Caretaker', 'Admin', 'Guardian'];
const USER_STATUS = ['Active', 'Inactive'];

// Invite role picker: label = displayed term, value = backend role.
// "Caretaker" is the display term; the backend role stays "caregiver".
const INVITE_ROLES = [
    { label: 'Patient', value: 'patient' },
    { label: 'Caretaker', value: 'caregiver' },
    { label: 'Admin', value: 'admin' },
    { label: 'Guardian', value: 'guardian' },
];

// Convert a backend role value to its display label (caregiver -> Caretaker).
const formatRoleLabel = (role) => {
    if (!role) return 'User';
    if (role === 'caregiver') return 'Caretaker';
    return role.charAt(0).toUpperCase() + role.slice(1);
};

export default function AdminHomeScreen() {
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const [activeTab, setActiveTab] = useState('All Users');
    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, activePatients: 0, caretakers: 0, pendingInvites: 0 });

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editRole, setEditRole] = useState('');
    const [editStatus, setEditStatus] = useState('Active'); // Using string for UI simplicity

    // Caretaker Assignment State
    const [assignedCaretakers, setAssignedCaretakers] = useState([]);
    const [initialAssignedCaretakers, setInitialAssignedCaretakers] = useState([]);
    const [allCaretakers, setAllCaretakers] = useState([]);
    const [caretakerSearchText, setCaretakerSearchText] = useState('');
    const [showCaretakerDropdown, setShowCaretakerDropdown] = useState(false);

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await ApiHelper.get(ENDPOINTS.ADMIN.STATS);
            if (response.success && response.stats) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'All Users') {
            const delayDebounceFn = setTimeout(() => {
                fetchUsers(searchText, selectedRole);
            }, 500);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [activeTab, searchText, selectedRole]);

    const fetchUsers = async (query = searchText, role = selectedRole, { silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            let url = ENDPOINTS.USERS;
            const params = [];

            // Map UI roles to DB values
            const roleMap = {
                'Patient': 'patient',
                'Caretaker': 'caregiver',
                'All': null
            };
            const dbRole = roleMap[role];

            if (query) params.push(`search=${encodeURIComponent(query)}`);
            if (dbRole) params.push(`role=${dbRole}`);

            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const response = await ApiHelper.get(url);
            if (response.success) {
                // Map API data to UI model
                const mappedUsers = response.users.map((user, index) => ({
                    id: user.id.toString(),
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
                    email: user.email,
                    role: formatRoleLabel(user.role),
                    status: user.is_active ? 'Active' : 'Inactive',
                    statusColor: user.is_active ? '#27AE60' : '#EB5757',
                    avatarText: ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || 'U',
                    image: user.profile_image_url,
                    is_active: user.is_active
                }));
                setUsers(mappedUsers);
            } else {
                Alert.alert("Error", "Failed to fetch users.");
            }
        } catch (error) {
            console.error("Fetch users error:", error);
            Alert.alert("Error", "An error occurred while fetching users.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const [invites, setInvites] = useState([]);

    const fetchInvites = async (query = '', { silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            let url = ENDPOINTS.INVITE.LIST;
            if (query) {
                url += `?search=${encodeURIComponent(query)}`;
            }
            const response = await ApiHelper.get(url);
            if (response.success) {
                const mappedInvites = response.invites.map(invite => {
                    // Status now comes from backend (registered/pending via JOIN)
                    const isRegistered = invite.status === 'registered';
                    return {
                        id: invite.id.toString(),
                        email: invite.email,
                        role: formatRoleLabel(invite.role),
                        status: isRegistered ? 'Registered' : 'Pending',
                        statusColor: isRegistered ? '#27AE60' : '#F2994A', // Green for registered, Orange for pending
                        date: new Date(invite.created_at).toLocaleDateString(),
                        reinviteCount: invite.reinvite_count || 0,
                        lastInvitedAt: invite.last_invited_at,
                        registeredName: isRegistered
                            ? `${invite.registered_first_name || ''} ${invite.registered_last_name || ''}`.trim()
                            : null
                    };
                });
                setInvites(mappedInvites);
            }
        } catch (error) {
            console.error("Fetch invites error:", error);
            Alert.alert("Error", "Failed to fetch invites.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleResendInvite = async (id) => {
        setLoading(true);
        try {
            const response = await ApiHelper.post(ENDPOINTS.INVITE.RESEND(id));
            if (response.success) {
                Alert.alert("Success", "Invite resent successfully!");
                fetchInvites(searchText, { silent: true }); // Refresh list in place
            }
        } catch (error) {
            console.error("Resend invite error:", error);
            Alert.alert("Error", "Failed to resend invite.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'All Users') {
            const delayDebounceFn = setTimeout(() => {
                fetchUsers(searchText, selectedRole);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else if (activeTab === 'Invites') {
            const delayDebounceFn = setTimeout(() => {
                fetchInvites(searchText);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [activeTab, searchText, selectedRole]);

    const fetchAssignedCaretakers = async (patientId) => {
        try {
            // Correctly constructing the URL: /caregiver-assignments/patient/:patientId
            const url = `${ENDPOINTS.CAREGIVER.PATIENT}/${patientId}`;
            const response = await ApiHelper.get(url);
            if (response.success) {
                const caregivers = response.caregivers || response.caretakers || [];
                setAssignedCaretakers(caregivers);
                setInitialAssignedCaretakers(caregivers);
            }
        } catch (error) {
            console.error("Error fetching assigned caregivers:", error);
        }
    };

    const fetchAllCaretakers = async () => {
        if (allCaretakers.length > 0) return; // Cache for session
        try {
            const response = await ApiHelper.get(`${ENDPOINTS.USERS}?role=${ROLES.CARETAKER}`);
            if (response.success && response.users) {
                setAllCaretakers(response.users);
            }
        } catch (error) {
            console.error("Error fetching all caregivers:", error);
        }
    };

    const openEditModal = async (user) => {
        setSelectedUser(user);
        setEditRole(user.role);
        setEditStatus(user.status);
        setAssignedCaretakers([]);
        setInitialAssignedCaretakers([]);
        setShowCaretakerDropdown(false);
        setCaretakerSearchText('');

        if (user.role === 'Patient') { // UI Role
            await fetchAssignedCaretakers(user.id);
            fetchAllCaretakers(); // Prefetch for dropdown
        }
        setEditModalVisible(true);
    };

    const handleSaveUser = async () => {
        setLoading(true);
        try {
            // 1. Update Role/Status (TODO: Implement User Update API)
            // await ApiHelper.put(`${ENDPOINTS.USERS}/${selectedUser.id}`, { role: editRole, is_active: editStatus === 'Active' });

            // 2. Handle Assignments (Diffing)
            const initialIds = new Set(initialAssignedCaretakers.map(c => c.id));
            const currentIds = new Set(assignedCaretakers.map(c => c.id));

            const toAdd = assignedCaretakers.filter(c => !initialIds.has(c.id));
            const toRemove = initialAssignedCaretakers.filter(c => !currentIds.has(c.id));

            const promises = [];
            const currentUser = await getCurrentUser();

            // Additions
            toAdd.forEach(caretaker => {
                promises.push(ApiHelper.post(ENDPOINTS.CAREGIVER.ASSIGN, {
                    patientId: selectedUser.id,
                    caregiverId: caretaker.id,
                    assignedBy: currentUser?.id
                }));
            });

            // Removals
            toRemove.forEach(caretaker => {
                promises.push(ApiHelper.delete(ENDPOINTS.CAREGIVER.REMOVE, {
                    patientId: selectedUser.id,
                    caregiverId: caretaker.id
                }));
            });

            await Promise.all(promises);

            Alert.alert("Success", "User details updated successfully", [
                {
                    text: "OK", onPress: () => {
                        setEditModalVisible(false);
                        fetchUsers(searchText, selectedRole, { silent: true });
                    }
                }
            ]);
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", "Failed to update user details.");
        } finally {
            setLoading(false);
        }
    };

    const toggleCaretakerAssignment = (caretaker, isAssigned) => {
        if (isAssigned) {
            // Remove locally
            setAssignedCaretakers(prev => prev.filter(c => c.id !== caretaker.id));
        } else {
            // Add locally
            setAssignedCaretakers(prev => [...prev, caretaker]);
        }
    };

    const renderStatCard = (item, value) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value.toLocaleString()}</Text>
                <Text style={styles.statTitle}>{item.title}</Text>
            </View>
        </View>
    );

    const renderUserCard = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userHeader}>
                <View style={styles.userInfoLeft}>
                    <Avatar uri={item.image} name={item.name} initials={item.avatarText} size={48} style={{ marginRight: 12 }} />
                    <View>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.userActions} onPress={() => openEditModal(item)}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            <View style={styles.userMeta}>
                <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>[{item.role}]</Text>
                    <View style={styles.dot} />
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <Text style={styles.assigneesLabel}>Assignees:</Text>
                {/* We don't have this data in listing yet, simplified for now */}
                <Text style={styles.noAssignees}>-</Text>
            </View>
        </View>
    );

    const renderInviteCard = ({ item }) => {
        const isRegistered = item.status === 'Registered';

        return (
            <View style={styles.inviteCard}>
                <View style={styles.inviteContent}>
                    <Text style={styles.inviteEmail}>{item.email}</Text>
                    <View style={styles.inviteMeta}>
                        <Text style={styles.inviteRole}>[{item.role}]</Text>
                        <Text style={[styles.inviteStatus, { color: item.statusColor }]}>
                            {isRegistered
                                ? '(Registered ✓)'
                                : item.reinviteCount > 0
                                    ? `(Resent ${item.reinviteCount}x)`
                                    : '(Pending)'}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.inviteDate}>
                        {isRegistered && item.registeredName
                            ? `Registered as: ${item.registeredName}`
                            : `Sent: ${item.date}`}
                    </Text>
                </View>
                <View style={styles.inviteAction}>
                    {!isRegistered && (
                        <TouchableOpacity onPress={() => handleResendInvite(item.id)} style={{ padding: 8 }}>
                            <Ionicons name="refresh-circle" size={32} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    {isRegistered && (
                        <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                    )}
                </View>
            </View>
        );
    };

    const renderSubCard = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userHeader}>
                <View style={styles.userInfoLeft}>
                    <View style={[styles.avatarContainer, { backgroundColor: '#E0E0E0' }]}>
                        {/* Placeholder for Image */}
                        <Text style={styles.avatarText}>{item.avatarText}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.userMeta}>
                <Text style={[styles.statusText, { color: colors.textSecondary }]}>Status:</Text>
                <View style={{ width: 16 }} />
                <Text style={[styles.statusText, { color: item.statusColor }]}>
                    (•) {item.status}
                </Text>
            </View>

            <View style={styles.timelineContainer}>
                <Text style={styles.timelineDate}>{item.startDate}</Text>
                <View style={styles.timelineBar}>
                    <View style={styles.timelineArrow} />
                </View>
                <Text style={styles.timelineDate}>{item.endDate}</Text>
            </View>

        </View>
    );

    const renderSkeleton = () => (
        <View style={styles.listContent}>
            {[1, 2, 3, 4].map(key => (
                <View key={key} style={styles.userCard}>
                    <View style={styles.userHeader}>
                        <View style={styles.userInfoLeft}>
                            <SkeletonLoader width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
                            <View>
                                <SkeletonLoader width={120} height={16} style={{ marginBottom: 6 }} />
                                <SkeletonLoader width={160} height={12} />
                            </View>
                        </View>
                    </View>
                    <View style={{ marginTop: 16 }}>
                        <SkeletonLoader width={80} height={20} borderRadius={10} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.cardFooter}>
                        <SkeletonLoader width={60} height={12} style={{ marginRight: 8 }} />
                        <SkeletonLoader width={24} height={24} borderRadius={12} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderSearchBar = () => (
        <View style={{ marginBottom: 16 }}>
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={activeTab === 'Invites' ? "Search invites..." : "Search by name, email..."}
                    placeholderTextColor={colors.textMuted}
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>
        </View>
    );

    const renderAllUsersHeader = () => (
        <View>
            {renderSearchBar()}
            {/* Stats Rail */}
            <View style={styles.statsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContent}>
                    {STATS_CONFIG.map(stat => (
                        <View key={stat.id} style={{ marginRight: 16 }}>
                            {renderStatCard(stat, stats[stat.key])}
                        </View>
                    ))}
                </ScrollView>
            </View>
            {/* Filter Pills */}
            <View style={[styles.filterPillsContainer, { paddingHorizontal: 20 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {FILTER_TABS.map(role => (
                        <TouchableOpacity
                            key={role}
                            style={[
                                styles.filterPill,
                                selectedRole === role && styles.activeFilterPill
                            ]}
                            onPress={() => setSelectedRole(role)}
                        >
                            <Text
                                style={[
                                    styles.filterPillText,
                                    selectedRole === role && styles.activeFilterPillText
                                ]}
                            >
                                {role}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderContent = () => {
        if (activeTab === 'All Users') {
            // Render search bar outside loading conditional to prevent keyboard dismiss
            const renderStatsAndFilters = () => (
                <View>
                    {/* Stats Rail */}
                    <View style={styles.statsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContent}>
                            {STATS_CONFIG.map(stat => (
                                <View key={stat.id} style={{ marginRight: 16 }}>
                                    {renderStatCard(stat, stats[stat.key])}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                    {/* Filter Pills */}
                    <View style={[styles.filterPillsContainer, { paddingHorizontal: 20 }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {FILTER_TABS.map(role => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.filterPill,
                                        selectedRole === role && styles.activeFilterPill
                                    ]}
                                    onPress={() => setSelectedRole(role)}
                                >
                                    <Text
                                        style={[
                                            styles.filterPillText,
                                            selectedRole === role && styles.activeFilterPillText
                                        ]}
                                    >
                                        {role}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            );

            return (
                <View style={{ flex: 1 }}>
                    {/* Search bar stays mounted to prevent keyboard dismiss */}
                    {renderSearchBar()}
                    {loading ? (
                        <View>
                            {renderStatsAndFilters()}
                            {renderSkeleton()}
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            renderItem={renderUserCard}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListHeaderComponent={renderStatsAndFilters}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', marginTop: 40 }}>
                                    <Text style={styles.emptyText}>No users found.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            );
        } else if (activeTab === 'Invites') {
            return (
                <View style={{ flex: 1 }}>
                    {/* Search bar stays mounted to prevent keyboard dismiss */}
                    {renderSearchBar()}
                    <FlatList
                        data={invites}
                        renderItem={renderInviteCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onRefresh={fetchInvites}
                        refreshing={loading}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={styles.emptyText}>No pending invites.</Text>
                            </View>
                        }
                    />
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => setInviteModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color={colors.textOnPrimary} />
                        <Text style={styles.fabText}>Invite</Text>
                    </TouchableOpacity>
                </View>
            );
        } /* else if (activeTab === 'Subs') {
            return (
                <>
                    <FlatList
                        data={SUBS}
                        renderItem={renderSubCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => (
                            <View>
                                {renderSearchBar()}
                                <View style={styles.subsStatsContainer}>
                                    <View style={styles.subsStatBlock}>
                                        <Text style={styles.subsStatLabel}>MRR</Text>
                                        <Text style={styles.subsStatValue}>$8,450</Text>
                                        <Text style={styles.subsStatTrend}>+12%</Text>
                                    </View>
                                    <View style={styles.subsStatDivider} />
                                    <View style={styles.subsStatBlock}>
                                        <Text style={styles.subsStatLabel}>Active Subs</Text>
                                        <Text style={styles.subsStatValue}>231</Text>
                                        <Text style={styles.subsStatTrend}>+3</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                </>
            )
        } */
    }

    // Invite Modal State
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('patient'); // Default (backend role value)

    const handleSendInvite = async () => {
        if (!inviteEmail) {
            Alert.alert("Error", "Please enter an email address.");
            return;
        }
        setLoading(true);
        try {
            await ApiHelper.post(ENDPOINTS.INVITE.SEND, {
                email: inviteEmail,
                role: inviteRole.toLowerCase(), // backend expects lowercase
            });
            Alert.alert("Success", "Invite sent successfully!", [
                {
                    text: "OK", onPress: () => {
                        setInviteModalVisible(false);
                        fetchInvites(searchText, { silent: true }); // Reload list in place
                    }
                }
            ]);
            setInviteEmail('');
        } catch (error) {
            console.error("Invite error:", error);
            Alert.alert("Error", error.message || "Failed to send invite.");
        } finally {
            setLoading(false);
        }
    };

    const renderInviteModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={inviteModalVisible}
            onRequestClose={() => setInviteModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Send Invite</Text>
                        <TouchableOpacity onPress={() => !loading && setInviteModalVisible(false)} disabled={loading}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubtitle}>Enter details to invite a new user.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="user@example.com"
                            placeholderTextColor={colors.textMuted}
                            value={inviteEmail}
                            onChangeText={setInviteEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Role</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {INVITE_ROLES.map(r => (
                                <TouchableOpacity
                                    key={r.value}
                                    style={[
                                        styles.filterPill,
                                        inviteRole === r.value && styles.activeFilterPill,
                                        loading && { opacity: 0.5 }
                                    ]}
                                    onPress={() => !loading && setInviteRole(r.value)}
                                    disabled={loading}
                                >
                                    <Text style={[
                                        styles.filterPillText,
                                        inviteRole === r.value && styles.activeFilterPillText
                                    ]}>{r.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.cancelButton, loading && { opacity: 0.5 }]}
                            onPress={() => setInviteModalVisible(false)}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.7 }]}
                            onPress={handleSendInvite}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.textOnPrimary} />
                            ) : (
                                <Text style={styles.saveButtonText}>Send Invite</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderEditUserModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit User: {selectedUser?.name}</Text>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubtitle}>Modify role, subscription, and assigned caretakers.</Text>

                    {/* Role Dropdown */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Role</Text>
                        <View style={styles.dropdown}>
                            {/* Simple custom dropdown representation */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: colors.text }}>{editRole}</Text>
                                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                            </View>
                        </View>
                    </View>

                    {/* Subscription Dropdown */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Subscription</Text>
                        <View style={styles.dropdown}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: colors.text }}>{editStatus}</Text>
                                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                            </View>
                        </View>
                    </View>

                    {/* Assigned Caregivers (Conditional) */}
                    {editRole === 'Patient' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Assigned Caretakers</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowCaretakerDropdown(!showCaretakerDropdown)}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: colors.textMuted }}>Select caretakers...</Text>
                                    <Ionicons name="chevron-expand" size={20} color={colors.primary} />
                                </View>
                            </TouchableOpacity>

                            {/* Assigned List (Chips) */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                                {assignedCaretakers.map(caretaker => (
                                    <TouchableOpacity
                                        key={caretaker.id}
                                        style={styles.selectedChip}
                                        onPress={() => toggleCaretakerAssignment(caretaker, true)}
                                    >
                                        <Text style={styles.selectedChipText}>{caretaker.first_name} {caretaker.last_name}</Text>
                                        <Ionicons name="close" size={14} color={colors.accentViolet} style={{ marginLeft: 4 }} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Dropdown List */}
                            {showCaretakerDropdown && (
                                <View style={styles.caretakerDropdownList}>
                                    <TextInput
                                        style={styles.dropdownSearch}
                                        placeholder="Search caretakers..."
                                        placeholderTextColor={colors.textMuted}
                                        value={caretakerSearchText}
                                        onChangeText={setCaretakerSearchText}
                                    />
                                    <ScrollView style={{ maxHeight: 150 }}>
                                        {allCaretakers
                                            .filter(c =>
                                                `${c.first_name} ${c.last_name}`.toLowerCase().includes(caretakerSearchText.toLowerCase())
                                            )
                                            .map(caretaker => {
                                                const isAssigned = assignedCaretakers.some(ac => ac.id === caretaker.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={caretaker.id}
                                                        style={styles.caretakerItem}
                                                        onPress={() => toggleCaretakerAssignment(caretaker, isAssigned)}
                                                    >
                                                        <View style={[styles.checkbox, isAssigned && styles.checkboxConfigured]}>
                                                            {isAssigned && <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />}
                                                        </View>
                                                        <Text style={{ marginLeft: 8, color: colors.text }}>
                                                            {caretaker.first_name} {caretaker.last_name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        }
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );


    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.pageSubtitle}>Manage your portal</Text>

                {/* Filter & Search Section - Tabs Only */}
                <View style={styles.filterSection}>
                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {renderContent()}
                {renderEditUserModal()}
                {renderInviteModal()}
            </View>
        </View>
    );
}

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    const f = t.fonts;
    const sh = t.shadows;
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
        },
        content: {
            flex: 1,
            paddingTop: 16,
        },
        pageSubtitle: {
            fontSize: 14,
            color: c.textSecondary,
            fontFamily: f.regular,
            paddingHorizontal: 20,
            marginBottom: 8,
        },
        statsContainer: {
            marginBottom: 8,
        },
        statsContent: {
            paddingHorizontal: 20,
            paddingBottom: 10,
        },
        statCard: {
            backgroundColor: c.surface,
            borderRadius: r.lg,
            padding: 16,
            width: 150,
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
            flexDirection: 'column',
        },
        statIconContainer: {
            width: 40,
            height: 40,
            borderRadius: r.md,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        statValue: {
            fontSize: 22,
            fontFamily: f.bold,
            color: c.text,
        },
        statTitle: {
            fontSize: 12,
            color: c.textMuted,
            fontFamily: f.medium,
            marginTop: 4,
        },
        filterSection: {
            paddingHorizontal: 20,
            marginBottom: 16,
        },
        tabsContainer: {
            flexDirection: 'row',
            marginBottom: 16,
        },
        tab: {
            marginRight: 24,
            paddingBottom: 8,
        },
        activeTab: {
            borderBottomWidth: 2,
            borderBottomColor: c.primary,
        },
        tabText: {
            fontSize: 16,
            color: c.textMuted,
            fontFamily: f.semibold,
        },
        activeTabText: {
            color: c.text,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surface,
            borderRadius: r.md,
            paddingHorizontal: 16,
            height: 48,
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
        },
        filterPillsContainer: {
            marginTop: 12,
            marginBottom: 16,
            flexDirection: 'row',
        },
        filterPill: {
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: r.pill,
            backgroundColor: c.surfaceAlt,
            marginRight: 8,
        },
        activeFilterPill: {
            backgroundColor: c.primary,
        },
        filterPillText: {
            fontSize: 13,
            color: c.textSecondary,
            fontFamily: f.medium,
        },
        activeFilterPillText: {
            color: c.textOnPrimary,
        },
        searchIcon: {
            marginRight: 12,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            color: c.text,
            fontFamily: f.regular,
        },
        listContent: {
            paddingHorizontal: 20,
            paddingBottom: 80, // Space for FAB
        },
        emptyText: {
            color: c.textMuted,
            fontFamily: f.regular,
        },
        userCard: {
            backgroundColor: c.surface,
            borderRadius: r.lg,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
        },
        userHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        userInfoLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatarContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: c.surfaceAlt,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        avatarText: {
            fontSize: 18,
            fontFamily: f.bold,
            color: c.primary,
        },
        userName: {
            fontSize: 16,
            fontFamily: f.bold,
            color: c.text,
        },
        userEmail: {
            fontSize: 13,
            color: c.textMuted,
            fontFamily: f.regular,
        },
        userActions: {
            padding: 4,
        },
        userMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
        },
        roleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceAlt,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: r.sm,
        },
        roleLabel: {
            fontSize: 12,
            color: c.textSecondary,
            fontFamily: f.semibold,
            marginRight: 6,
        },
        dot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: c.borderStrong,
            marginHorizontal: 8,
        },
        statusText: {
            fontSize: 12,
            fontFamily: f.semibold,
        },
        divider: {
            height: 1,
            backgroundColor: c.border,
            marginVertical: 12,
        },
        cardFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap', // Allow chips to wrap if many
        },
        assigneesLabel: {
            fontSize: 12,
            color: c.textMuted,
            fontFamily: f.regular,
            marginRight: 8,
        },
        assigneesContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
        },
        assigneeAvatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: c.surface,
        },
        assigneeChip: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
            borderWidth: 1,
            marginRight: 6,
            marginBottom: 2,
        },
        assigneeChipText: {
            fontSize: 10,
            fontFamily: f.semibold,
        },
        noAssignees: {
            fontSize: 12,
            color: c.textMuted,
            fontFamily: f.regular,
        },

        // --- Invite Card Styles ---
        inviteCard: {
            backgroundColor: c.surface,
            borderRadius: r.lg,
            padding: 20,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
        },
        inviteContent: {
            flex: 1,
        },
        inviteEmail: {
            fontSize: 16,
            fontFamily: f.bold,
            color: c.text,
            marginBottom: 8,
        },
        inviteMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        inviteRole: {
            fontSize: 14,
            color: c.textSecondary,
            fontFamily: f.regular,
            marginRight: 8,
        },
        inviteStatus: {
            fontSize: 14,
            fontFamily: f.semibold,
        },
        inviteDate: {
            fontSize: 12,
            color: c.textMuted,
            fontFamily: f.regular,
        },
        inviteAction: {
            paddingLeft: 16,
        },
        fab: {
            position: 'absolute',
            bottom: 24,
            right: 20,
            backgroundColor: c.primary,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: r.pill,
            ...sh.md,
        },
        fabText: {
            color: c.textOnPrimary,
            fontFamily: f.bold,
            fontSize: 16,
            marginLeft: 8,
        },

        // --- Subs Stats Styles ---
        subsStatsContainer: {
            flexDirection: 'row',
            backgroundColor: c.surface,
            marginHorizontal: 20,
            marginBottom: 20,
            borderRadius: r.lg,
            padding: 20,
            ...sh.sm,
        },
        subsStatBlock: {
            flex: 1,
            alignItems: 'flex-start',
        },
        subsStatDivider: {
            width: 1,
            backgroundColor: c.border,
            marginHorizontal: 20,
        },
        subsStatLabel: {
            fontSize: 14,
            color: c.textSecondary,
            fontFamily: f.regular,
            marginBottom: 4,
        },
        subsStatValue: {
            fontSize: 24,
            fontFamily: f.bold,
            color: c.text,
        },
        subsStatTrend: {
            fontSize: 14,
            color: c.success,
            marginTop: 4,
            fontFamily: f.semibold,
        },

        // --- Timeline Styles ---
        timelineContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: c.border,
        },
        timelineDate: {
            fontSize: 13,
            color: c.textSecondary,
            fontFamily: f.medium,
        },
        timelineBar: {
            flex: 1,
            height: 2,
            backgroundColor: c.border,
            marginHorizontal: 12,
            position: 'relative',
        },
        timelineArrow: {
            position: 'absolute',
            right: 0,
            top: -3,
            width: 8,
            height: 8,
            borderTopWidth: 2,
            borderRightWidth: 2,
            borderColor: c.textMuted,
            transform: [{ rotate: '45deg' }],
        },

        // --- Modal Styles ---
        modalOverlay: {
            flex: 1,
            backgroundColor: c.overlay,
            justifyContent: 'center',
            padding: 20,
        },
        modalContainer: {
            backgroundColor: c.surface,
            borderRadius: r.lg,
            padding: 20,
            ...sh.lg,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        modalTitle: {
            fontSize: 18,
            fontFamily: f.bold,
            color: c.text,
        },
        modalSubtitle: {
            fontSize: 14,
            color: c.textSecondary,
            fontFamily: f.regular,
            marginBottom: 20,
        },
        inputGroup: {
            marginBottom: 16,
        },
        label: {
            fontSize: 14,
            color: c.textSecondary,
            fontFamily: f.medium,
            marginBottom: 8,
        },
        input: {
            backgroundColor: c.surfaceSunken,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: r.md,
            padding: 12,
            color: c.text,
            fontFamily: f.regular,
            fontSize: 15,
        },
        dropdown: {
            backgroundColor: c.surfaceSunken,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: r.md,
            padding: 12,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 20,
        },
        cancelButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: r.md,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
            marginRight: 10,
        },
        cancelButtonText: {
            color: c.text,
            fontFamily: f.semibold,
        },
        saveButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: r.md,
            backgroundColor: c.primary,
        },
        saveButtonText: {
            color: c.textOnPrimary,
            fontFamily: f.semibold,
        },
        caretakerDropdownList: {
            backgroundColor: c.surface,
            borderRadius: r.md,
            marginTop: 4,
            padding: 8,
            maxHeight: 200,
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
        },
        dropdownSearch: {
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            padding: 8,
            marginBottom: 8,
            color: c.text,
            fontFamily: f.regular,
        },
        caretakerItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
        },
        checkbox: {
            width: 18,
            height: 18,
            borderWidth: 1,
            borderColor: c.borderStrong,
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
        },
        checkboxConfigured: {
            backgroundColor: c.accentViolet,
            borderColor: c.accentViolet,
        },
        selectedChip: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.primarySoft,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: r.pill,
            marginRight: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: c.accentViolet,
        },
        selectedChipText: {
            color: c.text,
            fontSize: 12,
            fontFamily: f.medium,
        }
    });
};
