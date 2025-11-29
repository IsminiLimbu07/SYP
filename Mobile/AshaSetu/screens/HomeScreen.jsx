// frontend/src/screens/HomeScreen.jsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);

  const quickActions = [
    {
      id: '1',
      title: 'Find Blood Donors',
      icon: '🩸',
      color: '#FFE5E5',
      action: () => console.log('Find Donors'),
      description: 'Search for nearby donors'
    },
    {
      id: '2',
      title: 'Request Blood',
      icon: '🏥',
      color: '#FFF4E5',
      action: () => console.log('Request Blood'),
      description: 'Create a blood request'
    },
    {
      id: '3',
      title: 'Donate Blood',
      icon: '❤️',
      color: '#E5F5FF',
      action: () => console.log('Donate Blood'),
      description: 'Register as a donor'
    },
    {
      id: '4',
      title: 'Volunteer',
      icon: '🤝',
      color: '#E5FFE5',
      action: () => console.log('Volunteer'),
      description: 'Join our team'
    }
  ];

  const recentActivities = [
    {
      id: '1',
      title: 'Blood Request Created',
      time: '2 days ago',
      type: 'request'
    },
    {
      id: '2',
      title: 'Profile Completed',
      time: '1 week ago',
      type: 'profile'
    }
  ];

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with User Info */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.full_name?.split(' ')[0] || 'User'}! 👋
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Lives Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Blood Units</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Requests Help</Text>
          </View>
        </View>

        {/* Emergency Blood Request Card */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyTitle}>Emergency Blood Requests</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <View style={styles.eyeIcon}>
                <View style={styles.eyeOuter} />
                <View style={styles.eyeInner} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <View style={styles.userIcon}>
                <FontAwesome name="user" size={18} color="#fff" />
              </View>
              <Text style={styles.detailText}>User Name</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.locationIcon}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#fff" />
              </View>
              <Text style={styles.detailText}>Location: Ktm</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.calendarIcon}>
                <FontAwesome5 name="calendar" size={16} color="#fff" />
              </View>
              <Text style={styles.detailText}>2082-07-22</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.respondButton}>
            <Text style={styles.respondButtonText}>Respond to Request</Text>
          </TouchableOpacity>
        </View>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="account-group" size={28} color="#8B0000" />
            </View>
            <Text style={styles.actionLabel}>Find Donors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <FontAwesome5 name="tint" size={24} color="#DC143C" />
            </View>
            <Text style={styles.actionLabel}>Blood Request</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <FontAwesome name="ambulance" size={26} color="#666" />
            </View>
            <Text style={styles.actionLabel}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <FontAwesome5 name="first-aid" size={24} color="#DC143C" />
            </View>
            <Text style={styles.actionLabel}>First Aid</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Nearby Events</Text>
          <View style={styles.eventCard}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/12227661/pexels-photo-12227661.jpeg' }}
              style={styles.eventImage}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.map(activity => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Text style={styles.activityArrow}>›</Text>
            </View>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>💡 Safety Tips</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipText}>
              • Always verify donor credentials before accepting blood
            </Text>
            <Text style={styles.tipText}>
              • Report any suspicious activity to admins
            </Text>
            <Text style={styles.tipText}>
              • Keep your medical history updated
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="hand-coin" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="account-group-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={handleProfilePress}
        >
          <MaterialCommunityIcons name="account-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollView: {
    flex: 1
  },
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20
  },
  headerTop: {
    flex: 1
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5
  },
  profileButton: {
    marginLeft: 15
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B0000'
  },
  avatarTextSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  seeAll: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500'
  },
  emergencyCard: {
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  viewAllButton: {
    padding: 5
  },
  eyeIcon: {
    width: 24,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  eyeOuter: {
    width: 24,
    height: 16,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12
  },
  eyeInner: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4
  },
  requestDetails: {
    marginBottom: 20
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 5
  },
  userIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff'
  },
  userBody: {
    width: 14,
    height: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginTop: 2
  },
  locationIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  locationPin: {
    width: 12,
    height: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 6
  },
  locationBase: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    marginTop: -2
  },
  calendarIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
    justifyContent: 'center'
  },
  calendarTop: {
    width: 18,
    height: 4,
    backgroundColor: '#fff',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2
  },
  calendarBody: {
    width: 18,
    height: 14,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: '#fff'
  },
  detailText: {
    fontSize: 15,
    color: '#fff'
  },
  respondButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center'
  },
  respondButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#E8E8E8',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#D0D0D0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  plusIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  plusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: '#666'
  },
  plusVertical: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: '#666'
  },
  dropIcon: {
    width: 20,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dropShape: {
    width: 16,
    height: 20,
    backgroundColor: '#DC143C',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '45deg' }]
  },
  ambulanceIcon: {
    width: 28,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  ambulanceBody: {
    width: 24,
    height: 14,
    backgroundColor: '#666',
    borderRadius: 4
  },
  aidIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  aidBox: {
    width: 20,
    height: 20,
    backgroundColor: '#DC143C',
    borderRadius: 4
  },
  actionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center'
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 20
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  eventImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover'
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B0000',
    marginRight: 12
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3
  },
  activityTime: {
    fontSize: 12,
    color: '#999'
  },
  activityArrow: {
    fontSize: 18,
    color: '#8B0000',
    marginLeft: 10
  },
  tipsCard: {
    backgroundColor: '#FFF9E5',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000'
  },
  tipText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 4
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 10,
    flex: 1
  },
  homeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  homeBase: {
    width: 18,
    height: 12,
    backgroundColor: '#666',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2
  },
  homeRoof: {
    position: 'absolute',
    top: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#666'
  },
  targetIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  targetOuter: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#666'
  },
  targetMiddle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#666'
  },
  targetInner: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666'
  },
  syringeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }]
  },
  syringeBarrel: {
    width: 12,
    height: 16,
    backgroundColor: '#666',
    borderRadius: 2
  },
  syringeNeedle: {
    width: 2,
    height: 8,
    backgroundColor: '#666',
    marginTop: -1
  },
  profileIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#666'
  },
  profileBody: {
    width: 18,
    height: 12,
    backgroundColor: '#666',
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    marginTop: 2
  }
});

export default HomeScreen;