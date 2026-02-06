import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function AmbulanceScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cityModal, setCityModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  // Emergency Ambulance Services in Nepal
  const ambulanceServices = [
    {
      id: 1,
      name: 'Nepal Red Cross Society',
      phone: '102',
      type: 'emergency',
      city: 'Nationwide',
      available24x7: true,
      description: 'Free emergency ambulance service across Nepal',
    },
    {
      id: 2,
      name: 'Nepal Police',
      phone: '100',
      type: 'emergency',
      city: 'Nationwide',
      available24x7: true,
      description: 'Police emergency helpline',
    },
    {
      id: 3,
      name: 'CIWEC Hospital',
      phone: '01-4424111',
      type: 'hospital',
      city: 'Kathmandu',
      available24x7: true,
      address: 'Lainchaur, Kathmandu',
    },
    {
      id: 4,
      name: 'Norvic International Hospital',
      phone: '01-4258554',
      type: 'hospital',
      city: 'Kathmandu',
      available24x7: true,
      address: 'Thapathali, Kathmandu',
    },
    {
      id: 5,
      name: 'Tribhuvan University Teaching Hospital',
      phone: '01-4412404',
      type: 'hospital',
      city: 'Kathmandu',
      available24x7: true,
      address: 'Maharajgunj, Kathmandu',
    },
    {
      id: 6,
      name: 'Grande International Hospital',
      phone: '01-5159266',
      type: 'hospital',
      city: 'Kathmandu',
      available24x7: true,
      address: 'Tokha Road, Kathmandu',
    },
    {
      id: 7,
      name: 'B.P. Koirala Institute',
      phone: '025-525555',
      type: 'hospital',
      city: 'Dharan',
      available24x7: true,
      address: 'Dharan-9, Sunsari',
    },
    {
      id: 8,
      name: 'Manipal Teaching Hospital',
      phone: '061-526416',
      type: 'hospital',
      city: 'Pokhara',
      available24x7: true,
      address: 'Phulbari, Pokhara',
    },
    {
      id: 9,
      name: 'Patan Hospital',
      phone: '01-5522266',
      type: 'hospital',
      city: 'Lalitpur',
      available24x7: true,
      address: 'Lagankhel, Lalitpur',
    },
    {
      id: 10,
      name: 'Bir Hospital',
      phone: '01-4221119',
      type: 'hospital',
      city: 'Kathmandu',
      available24x7: true,
      address: 'Tundikhel, Kathmandu',
    },
  ];

  const handleEmergencyCall = (phone, name) => {
    Alert.alert(
      'Emergency Call',
      `Call ${name} ambulance service?\n\nPhone: ${phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            Linking.openURL(`tel:${phone}`);
          },
          style: 'default',
        },
      ]
    );
  };

  const filteredServices = ambulanceServices.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity =
      selectedCity === 'all' || service.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* Emergency Banner */}
      <View style={styles.emergencyBanner}>
        <View style={styles.emergencyIconContainer}>
          <MaterialCommunityIcons name="ambulance" size={32} color="#fff" />
        </View>
        <View style={styles.emergencyTextContainer}>
          <Text style={styles.emergencyTitle}>In Critical Emergency?</Text>
          <Text style={styles.emergencySubtext}>Call 102 for immediate help</Text>
        </View>
        <TouchableOpacity
          style={styles.emergencyCallBtn}
          onPress={() => Linking.openURL('tel:102')}
        >
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospital or service..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* City Filter (compact dropdown) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setCityModal(true)}
        >
          <Text style={styles.dropdownButtonText}>{selectedCity === 'all' ? 'All' : selectedCity}</Text>
          <Ionicons name="chevron-down" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      <Modal visible={cityModal} transparent animationType="fade">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select City</Text>
            {['all', 'Nationwide', 'Kathmandu', 'Lalitpur', 'Pokhara', 'Dharan'].map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCity(city);
                  setCityModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{city === 'all' ? 'All' : city}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setCityModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Services List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Services Section */}
        <Text style={styles.sectionTitle}>Emergency Services</Text>
        {filteredServices
          .filter((s) => s.type === 'emergency')
          .map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.emergencyBadge}>
                  <MaterialCommunityIcons name="hospital-marker" size={24} color="#fff" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                  <View style={styles.cityBadge}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.cityText}>{service.city}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.serviceFooter}>
                <View style={styles.available24Badge}>
                  <Ionicons name="time" size={16} color="#4CAF50" />
                  <Text style={styles.available24Text}>24/7 Available</Text>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleEmergencyCall(service.phone, service.name)}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.callBtnText}>{service.phone}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        {/* Hospital Ambulances Section */}
        <Text style={styles.sectionTitle}>Hospital Ambulances</Text>
        {filteredServices
          .filter((s) => s.type === 'hospital')
          .map((service) => (
            <View key={service.id} style={styles.hospitalCard}>
              <View style={styles.hospitalHeader}>
                <MaterialCommunityIcons name="hospital-building" size={28} color="#8B0000" />
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{service.name}</Text>
                  {service.address && (
                    <Text style={styles.hospitalAddress}>{service.address}</Text>
                  )}
                  <View style={styles.cityBadge}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.cityText}>{service.city}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.hospitalActions}>
                <TouchableOpacity
                  style={styles.callHospitalBtn}
                  onPress={() => handleEmergencyCall(service.phone, service.name)}
                >
                  <Ionicons name="call-outline" size={20} color="#8B0000" />
                  <Text style={styles.callHospitalText}>{service.phone}</Text>
                </TouchableOpacity>

                {userLocation && (
                  <TouchableOpacity
                    style={styles.directionsBtn}
                    onPress={() => {
                      const url = Platform.select({
                        ios: `maps:0,0?q=${service.name}`,
                        android: `geo:0,0?q=${service.name}`,
                      });
                      Linking.openURL(url);
                    }}
                  >
                    <Ionicons name="navigate" size={18} color="#4CAF50" />
                    <Text style={styles.directionsBtnText}>Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

        {filteredServices.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ambulance-off" size={64} color="#DDD" />
            <Text style={styles.emptyText}>No services found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  emergencyBanner: {
    backgroundColor: '#FF1744',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  emergencyIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emergencySubtext: {
    fontSize: 13,
    color: '#fff',
    marginTop: 2,
    opacity: 0.9,
  },
  emergencyCallBtn: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  filterContainer: {
    marginTop: 12,
    paddingLeft: 16,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 44,
    maxWidth: 90,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 140,
    marginLeft: 16,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalItemText: {
    fontSize: 14,
    color: '#333',
  },
  modalClose: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#8B0000',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  emergencyBadge: {
    width: 50,
    height: 50,
    backgroundColor: '#FF1744',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  available24Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  available24Text: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  callBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  hospitalHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hospitalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  hospitalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callHospitalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#8B0000',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  callHospitalText: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '600',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  directionsBtnText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 6,
  },
  bottomSpacing: {
    height: 20,
  },
});