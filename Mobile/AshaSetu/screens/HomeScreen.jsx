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
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0]}! 👋</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {user?.full_name?.charAt(0).toUpperCase()}
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <FlatList
            data={quickActions}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: item.color }]}
                onPress={item.action}
              >
                <Text style={styles.actionIcon}>{item.icon}</Text>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionDescription}>{item.description}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            columnWrapperStyle={styles.actionRow}
          />
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
        <View style={[styles.section, { marginBottom: 30 }]}>
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

      {/* Bottom Navigation Hint */}
      <TouchableOpacity 
        style={styles.profileLinkButton}
        onPress={handleProfilePress}
      >
        <Text style={styles.profileLinkText}>View My Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollView: {
    flex: 1,
    paddingTop: 0
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
  actionRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 8
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
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
  profileLinkButton: {
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  profileLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default HomeScreen;