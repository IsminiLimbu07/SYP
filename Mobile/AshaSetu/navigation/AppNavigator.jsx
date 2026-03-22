// Mobile/AshaSetu/navigation/AppNavigator.jsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

// ── Auth Screens ──────────────────────────────────────────────────────────────
import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgetPasswordScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// ── Main Screens ──────────────────────────────────────────────────────────────
import HomeScreen               from '../screens/HomeScreen';
import ProfileScreen            from '../screens/ProfileScreen';
import EditProfileScreen        from '../screens/EditProfileScreen';
import ChangePasswordScreen     from '../screens/ChangePasswordScreen';
import FindDonorsScreen         from '../screens/FindDonorScreen';
import BloodRequestScreen       from '../screens/BloodRequestScreen';
import BloodRequestsFeedScreen  from '../screens/BloodRequestsFeedScreen';
import AmbulanceScreen          from '../screens/AmbulanceScreen';
import FirstAidScreen           from '../screens/FirstAidScreen';
import DonationScreen           from '../screens/DonationScreen';
import RespondToRequestScreen   from '../screens/RespondToRequestScreen';
import ManageResponseScreen     from '../screens/ManageResponseScreen';
import MyDonationResponseScreen from '../screens/MyDonationResponseScreen';
import VerifyEmailScreen        from '../screens/VerifyEmailScreen';
import VolunteerApplicationScreen from '../screens/VolunteerApplicationScreen';
import VolunteerStatusScreen from '../screens/VolunteerStatusScreen';
import ManageVolunteersScreen from '../screens/admin/ManageVolunteersScreen';

// ── Community Screens ─────────────────────────────────────────────────────────
import CommunityHomeScreen      from '../screens/CommunityHomeScreen';
import CommunityChatroomScreen  from '../screens/CommunityChatRoomScreen';
import CreateEventScreen        from '../screens/CreateEventScreen';
import EventDetailsScreen       from '../screens/EventDetailsScreen';

// ── Campaign Screens ──────────────────────────────────────────────────────────
import CreateCampaignScreen     from '../screens/CreateCampaignScreen';
import CampaignDetailsScreen    from '../screens/CampaignDetailsScreen';

// ── Notification Screen ───────────────────────────────────────────────────────
import NotificationsScreen      from '../screens/NotificationScreen';

// ── Admin Screens ─────────────────────────────────────────────────────────────
import AdminDashboard           from '../screens/admin/AdminDashboard';
import SendNotificationScreen   from '../screens/admin/SendNotificationScreen';

// ── Deep-link config ──────────────────────────────────────────────────────────
export const linking = {
  prefixes: ['ashasetu://', 'exp://127.0.0.1:4040/--/'],
  config: {
    screens: {
      VerifyEmail: 'verify-email',
    },
  },
};

const Stack = createNativeStackNavigator();

const darkRedHeader = {
  headerStyle:      { backgroundColor: '#8B0000' },
  headerTintColor:  '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

const AppNavigator = () => {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? (isAdmin ? 'AdminDashboard' : 'Home') : 'Login'}
    >
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Dashboard', ...darkRedHeader }} />
          <Stack.Screen name="SendNotification" component={SendNotificationScreen} options={{ title: 'Send Notification', ...darkRedHeader }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', ...darkRedHeader }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event', ...darkRedHeader }} />
          <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} options={{ title: 'Create Campaign', ...darkRedHeader }} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details', ...darkRedHeader }} />
          <Stack.Screen name="CampaignDetails" component={CampaignDetailsScreen} options={{ title: 'Campaign Details', ...darkRedHeader }} />
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
          <Stack.Screen name="Donation" component={DonationScreen} options={{ title: 'Fund Raising', ...darkRedHeader }} />
          <Stack.Screen name="Community" component={CommunityHomeScreen} options={{ title: 'Community', ...darkRedHeader }} />
          <Stack.Screen name="CommunityChatroom" component={CommunityChatroomScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: 'Verify Email', ...darkRedHeader }} />
          <Stack.Screen name="VolunteerApplication" component={VolunteerApplicationScreen} options={{ title: 'Become a Volunteer', ...darkRedHeader }} />
          <Stack.Screen name="VolunteerStatus" component={VolunteerStatusScreen} options={{ title: 'Volunteer Status', ...darkRedHeader }} />
          <Stack.Screen name="ManageVolunteers" component={ManageVolunteersScreen} options={{ title: 'Manage Volunteers', ...darkRedHeader }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"    component={LoginScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register', ...darkRedHeader }} />
          {/* ── Forgot Password Flow ── */}
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;