// frontend/src/navigation/AppNavigator.jsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';

// ── Auth Screens ──
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// ── Main Screens ──
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
import RespondToRequestScreen from '../screens/RespondToRequestScreen';
import ManageResponseScreen from '../screens/ManageResponseScreen';
import MyDonationResponseScreen from '../screens/MyDonationResponseScreen';

// ── Community Screens ──
import CommunityHomeScreen from '../screens/CommunityHomeScreen';
import CommunityChatroomScreen from '../screens/CommunityChatRoomScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';

// ── Campaign Screens (NEW) ──
import CreateCampaignScreen from '../screens/CreateCampaignScreen';
import CampaignDetailsScreen from '../screens/CampaignDetailsScreen';

export const linking = {
  prefixes: [
    'ashasetu://',
    'exp:// http://127.0.0.1:4040/--/',
  ],
  config: {
    screens: {
      VerifyEmail: 'verify-email',
    },
  },
};

const Stack = createNativeStackNavigator();

const darkRedHeader = {
  headerStyle: { backgroundColor: '#8B0000' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

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
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile', ...darkRedHeader }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile', ...darkRedHeader }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password', ...darkRedHeader }} />

          <Stack.Screen name="FindDonor" component={FindDonorsScreen} options={{ title: 'Find Donors', ...darkRedHeader }} />
          <Stack.Screen name="BloodRequest" component={BloodRequestScreen} options={{ title: 'Blood Request', ...darkRedHeader }} />
          <Stack.Screen name="BloodRequestsFeed" component={BloodRequestsFeedScreen} options={{ title: 'Blood Requests', ...darkRedHeader }} />
          <Stack.Screen name="RespondToRequest" component={RespondToRequestScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ManageResponses" component={ManageResponseScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyDonationResponses" component={MyDonationResponseScreen} options={{ headerShown: false }} />

          <Stack.Screen name="Ambulance" component={AmbulanceScreen} options={{ title: 'Ambulance Services', ...darkRedHeader }} />
          <Stack.Screen name="FirstAid" component={FirstAidScreen} options={{ title: 'First Aid', ...darkRedHeader }} />

          {/* Donation / Campaigns */}
          <Stack.Screen name="Donation" component={DonationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CampaignDetails" component={CampaignDetailsScreen} options={{ headerShown: false }} />

          {/* Community */}
          <Stack.Screen name="Community" component={CommunityHomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CommunityChatroom" component={CommunityChatroomScreen} options={{ headerShown: false }} />

          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: 'Verify Email', ...darkRedHeader }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register', ...darkRedHeader }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;