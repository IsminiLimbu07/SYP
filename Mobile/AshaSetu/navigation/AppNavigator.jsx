// frontend/src/navigation/AppNavigator.jsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import FindDonorsScreen from '../screens/FindDonorScreen';
import BloodRequestScreen from '../screens/BloodRequestScreen';
import BloodRequestsFeedScreen from '../screens/BloodRequestsFeedScreen';
import AmbulanceScreen from '../screens/AmbulanceScreen';
import FirstAidScreen from '../screens/FirstAidScreen';
import DonationScreen from '../screens/DonationScreen';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {user ? (
        // Authenticated Stack
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ 
              title: 'My Profile',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ 
              title: 'Edit Profile',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen 
            name="ChangePassword" 
            component={ChangePasswordScreen}
            options={{ 
              title: 'Change Password',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
        
          <Stack.Screen 
            name="FindDonor" 
            component={FindDonorsScreen}
            options={{ 
              title: 'Find Donors',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen
            name="Ambulance"
            component={AmbulanceScreen}
            options={{
              title: 'Ambulance Services',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen
            name="FirstAid"
            component={FirstAidScreen}
            options={{
              title: 'First Aid',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen
            name="Donation"
            component={DonationScreen}
            options={{
              title: 'Donate Blood',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen 
            name="BloodRequest" 
            component={BloodRequestScreen}
            options={{ 
              title: 'Blood Request',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          <Stack.Screen
            name="BloodRequestsFeed"
            component={BloodRequestsFeedScreen}
            options={{
              title: 'Blood Requests',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
        </>
      ) : (
        // Guest Stack
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ 
              title: 'Register',
              headerStyle: { backgroundColor: '#8B0000' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;