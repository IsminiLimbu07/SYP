import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const donors = [
  {
    id: 1,
    name: 'Ismini Limbu',
    location: 'Dharan',
    blood: 'B+',
    img: 'https://i.pravatar.cc/150?img=47'
  },
  {
    id: 2,
    name: 'Niroj Bhandari',
    location: 'Biratnagar',
    blood: 'A+',
    img: 'https://i.pravatar.cc/150?img=12'
  },
  {
    id: 3,
    name: 'Nitam Bhattarai',
    location: 'Itahari',
    blood: 'O-',
    img: 'https://i.pravatar.cc/150?img=30'
  },
  {
    id: 4,
    name: 'Swikriti Mishra',
    location: 'Damak',
    blood: 'AB+',
    img: 'https://i.pravatar.cc/150?img=5'
  },
  {
    id: 5,
    name: 'Urgen Gurung',
    location: 'Jogbani',
    blood: 'AB+',
    img: 'https://i.pravatar.cc/150?img=18'
  }
];

export default function FindDonorsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="arrow-back" size={26} />
        </TouchableOpacity>
        <Text style={styles.title}>Find Donors</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Enter blood type"
          style={styles.input}
        />
        <Icon name="search" size={20} color="#555" />
      </View>

      {/* Donor List */}
      {donors.map((d) => (
        <View key={d.id} style={styles.card}>
          <Image source={{ uri: d.img }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{d.name}</Text>

            <View style={styles.locationRow}>
              <Icon name="location" size={16} color="#000" />
              <Text style={styles.location}>{d.location}</Text>
            </View>

            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>View details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{d.blood}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 15
  },

  searchBox: {
    backgroundColor: '#f2f2f2',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20
  },

  input: {
    flex: 1,
    fontSize: 15
  },

  card: {
    backgroundColor: '#f6f6f6',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 50,
    marginRight: 15
  },

  name: {
    fontSize: 17,
    fontWeight: '700'
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },

  location: {
    fontSize: 14,
    marginLeft: 5
  },

  bloodBadge: {
    backgroundColor: '#8A0000',
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },

  bloodText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },

  btn: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start'
  },

  btnText: {
    color: '#fff',
    fontWeight: '600'
  }
});
