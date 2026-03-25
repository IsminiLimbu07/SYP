// Mobile/AshaSetu/screens/admin/AdminDashboard.jsx
import React, { useState, useContext, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getUsers, deleteUser } from '../../api/admin';

const AdminDashboard = ({ navigation }) => {
  const { token, logout } = useContext(AuthContext);
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUsers(token);
      setUsers(res.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('SendNotification')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(token, user.user_id);
              setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
              setModalVisible(false);
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone_number?.includes(searchQuery)
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => { setSelectedUser(item); setModalVisible(true); }}
      activeOpacity={0.85}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <Text style={styles.userPhone}>{item.phone_number}</Text>
          {item.is_admin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield" size={11} color="#8B0000" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {!item.is_verified && (
            <View style={styles.unverifiedBadge}>
              <Text style={styles.unverifiedBadgeText}>Unverified</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteUser(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.filter(u => u.is_admin).length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.filter(u => u.is_verified).length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.filter(u => u.is_active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* ── Management Cards ── */}

      {/* Campaign Management */}
      <TouchableOpacity
        style={styles.managementCard}
        onPress={() => navigation.navigate('ManageCampaigns')}
        activeOpacity={0.8}
      >
        <View style={styles.managementCardHeader}>
          <View style={[styles.managementCardIcon, { backgroundColor: '#fff5f5' }]}>
            <Ionicons name="heart" size={24} color="#8B0000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.managementCardTitle}>Campaign Management</Text>
            <Text style={styles.managementCardSubtitle}>
              Review and approve fundraising campaigns
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      {/* Volunteer Management */}
      <TouchableOpacity
        style={styles.managementCard}
        onPress={() => navigation.navigate('ManageVolunteers')}
        activeOpacity={0.8}
      >
        <View style={styles.managementCardHeader}>
          <View style={[styles.managementCardIcon, { backgroundColor: '#f0f9f0' }]}>
            <Ionicons name="people" size={24} color="#2E7D32" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.managementCardTitle}>Volunteer Management</Text>
            <Text style={styles.managementCardSubtitle}>
              Review applications and manage volunteers
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      {/* ── NEW: Event Management Card ── */}
      <TouchableOpacity
        style={styles.managementCard}
        onPress={() => navigation.navigate('ManageEvents')}
        activeOpacity={0.8}
      >
        <View style={styles.managementCardHeader}>
          <View style={[styles.managementCardIcon, { backgroundColor: '#fff8e1' }]}>
            <Ionicons name="calendar" size={24} color="#F57F17" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.managementCardTitle}>Event Management</Text>
            <Text style={styles.managementCardSubtitle}>
              View and delete blood donation events
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      {/* ── Search ── */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#bbb"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── User List ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#8B0000" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
        />
      )}

      {/* ── User Detail Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalBody}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedUser.full_name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.modalUserName}>{selectedUser.full_name}</Text>

                {[
                  { icon: 'mail-outline',            text: selectedUser.email },
                  { icon: 'call-outline',             text: selectedUser.phone_number },
                  { icon: 'water-outline',            text: `Blood Group: ${selectedUser.blood_group || 'Not set'}` },
                  { icon: 'location-outline',         text: `City: ${selectedUser.city || 'Not set'}` },
                  { icon: 'calendar-outline',         text: `Joined: ${new Date(selectedUser.created_at).toLocaleDateString('en-US', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'short', day: 'numeric' })}` },
                  { icon: 'shield-outline',           text: `Role: ${selectedUser.is_admin ? 'Administrator' : 'Regular User'}` },
                  { icon: 'checkmark-circle-outline', text: `Verified: ${selectedUser.is_verified ? '✅ Yes' : '❌ No'}` },
                  { icon: 'power-outline',            text: `Status: ${selectedUser.is_active ? '🟢 Active' : '🔴 Suspended'}` },
                ].map((row, i) => (
                  <View key={i} style={styles.modalRow}>
                    <Ionicons name={row.icon} size={18} color="#666" />
                    <Text style={styles.modalRowText}>{row.text}</Text>
                  </View>
                ))}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnDelete]}
                    onPress={() => handleDeleteUser(selectedUser)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.modalBtnText}>Delete User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnClose]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1, marginLeft: 12 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', padding: 12, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10,
    padding: 12, alignItems: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#8B0000' },
  statLabel:  { fontSize: 11, color: '#999', marginTop: 2 },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },

  // List
  listContent: { paddingHorizontal: 12, paddingBottom: 20 },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#8B0000',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  userAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  userInfo:  { flex: 1 },
  userName:  { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  userEmail: { fontSize: 13, color: '#666', marginBottom: 4 },
  userMeta:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  userPhone: { fontSize: 12, color: '#999' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fce8e8', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 12, gap: 4,
  },
  adminBadgeText:      { fontSize: 10, color: '#8B0000', fontWeight: '600' },
  unverifiedBadge:     { backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  unverifiedBadgeText: { fontSize: 10, color: '#e65100', fontWeight: '600' },
  deleteButton: { padding: 8 },

  // Empty
  empty:     { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 20,
    width: '90%', maxHeight: '85%', overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitle:  { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody:   { padding: 20 },
  modalAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#8B0000',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  modalAvatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  modalUserName: {
    fontSize: 20, fontWeight: 'bold', color: '#333',
    textAlign: 'center', marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', gap: 12,
  },
  modalRowText:  { fontSize: 15, color: '#333', flex: 1 },
  modalActions:  { marginTop: 20, gap: 10 },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 14,
    borderRadius: 10, gap: 8,
  },
  modalBtnDelete: { backgroundColor: '#ff3b30' },
  modalBtnClose:  { backgroundColor: '#888' },
  modalBtnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Management cards
  managementCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  managementCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  managementCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  managementCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  managementCardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

export default AdminDashboard;