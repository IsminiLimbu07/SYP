# AshaSetu System Architecture & Navigation Documentation

**Date:** February 6, 2026  
**Project:** AshaSetu - Blood Donation & Emergency Services Platform  
**Platform:** React Native (Expo)

---

## Table of Contents
1. [Navigation Structure](#navigation-structure)
2. [Authentication Flow](#authentication-flow)
3. [Location Integration](#location-integration)
4. [System Flow Overview](#system-flow-overview)
5. [Ambulance Screen Deep Dive](#ambulance-screen-deep-dive)
6. [Technology Stack](#technology-stack)
7. [Screen Navigation Guide](#screen-navigation-guide)

---

## Navigation Structure

### Overview
The application uses **React Navigation's Stack Navigator** as the core navigation system. The navigation state is controlled by the `AuthContext`, which determines whether to show authenticated or guest screens based on user login status.

### Navigation Architecture Diagram

```
AppNavigator (Root Navigation Stack)
├── AuthContext (Checks user authentication status)
├── IF USER IS NOT LOGGED IN (Guest Stack)
│   ├── Login Screen
│   └── Register Screen
└── IF USER IS LOGGED IN (Authenticated Stack)
    ├── Home Screen (Default entry)
    ├── Profile & Profile Management
    │   ├── Profile Screen
    │   ├── EditProfile Screen
    │   └── ChangePassword Screen
    ├── Blood Services
    │   ├── FindDonor Screen
    │   ├── BloodRequest Screen
    │   └── BloodRequestsFeed Screen
    ├── Emergency Services
    │   ├── Ambulance Screen
    │   └── FirstAid Screen
    └── Donation Screen
```

### Navigation Files
- **File:** `navigation/AppNavigator.jsx`
- **Purpose:** Main stack navigator managing all screen routes
- **Key Logic:** Conditionally renders authenticated or guest stacks based on `AuthContext` user state

### Screen Stack Configuration

#### Guest Stack (Unauthenticated Users)
```javascript
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
```

#### Authenticated Stack (Logged-in Users)
All authenticated screens include:
- Dark red header (`#8B0000`)
- White text
- Bold title styling

**Screens included:**
- Home (primary hub)
- Profile management (Profile, EditProfile, ChangePassword)
- Blood services (FindDonor, BloodRequest, BloodRequestsFeed)
- Emergency services (Ambulance, FirstAid)
- Donation services (Donation)

---

## Authentication Flow

### Entry Point
**File:** `app/_layout.tsx`

```typescript
import { AuthProvider } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
```

The entire app is wrapped in `AuthProvider`, which manages global authentication state.

### AuthContext Implementation
**File:** `context/AuthContext.js`

#### State Management
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
```

#### Bootstrap Process (On App Launch)
```javascript
useEffect(() => {
  const bootstrapAsync = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('userToken');
      const savedUser = await AsyncStorage.getItem('userData');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Failed to restore token:', e);
    } finally {
      setLoading(false);
    }
  };

  bootstrapAsync();
}, []);
```

**Process:**
1. Check AsyncStorage for saved token and user data
2. If found, restore user session automatically
3. Set loading to false (trigger UI render)

#### Login Function
```javascript
const login = async (userToken, userData) => {
  try {
    await AsyncStorage.setItem('userToken', userToken);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));

    setToken(userToken);
    setUser(userData);
    setIsAuthenticated(true);

    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};
```

**Saves to:**
- `AsyncStorage.userToken` - JWT authentication token
- `AsyncStorage.userData` - User object (id, email, name, etc.)

#### Logout Function
```javascript
const logout = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};
```

### Login Screen Implementation
**File:** `screens/LoginScreen.jsx`

#### User Flow
1. User enters email and password
2. Clicks "Login"
3. `handleLogin()` is triggered
4. API call to backend
5. On success, `AuthContext.login()` is called
6. AppNavigator detects `user` is set and renders authenticated stack

#### Code Flow
```javascript
const handleLogin = async () => {
  if (!email.trim() || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  setLoading(true);
  try {
    const response = await loginUser({ email, password });
    
    if (response.success) {
      await login(response.token, response.user);
    }
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  } finally {
    setLoading(false);
  }
};
```

### API Authentication
**File:** `api/auth.js`

```javascript
export const loginUser = async (credentials) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }

    return {
      success: response.success,
      message: response.message,
      token: response.data.token,
      user: response.data.user,
    };
  } catch (error) {
    throw error;
  }
};
```

### API Configuration
**File:** `config/api.js`

```javascript
const NGROK_URL = 'https://tularaemic-electroneutral-ozella.ngrok-free.dev';
const API_BASE_URL = `${NGROK_URL}/api`;

export const apiConfig = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      REGISTER: `${API_BASE_URL}/auth/register`,
      LOGIN: `${API_BASE_URL}/auth/login`,
      PROFILE: `${API_BASE_URL}/auth/profile`,
      UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
      CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    },
  },
};
```

**Backend Server:** `Backend/server.js` (Port 9000, tunneled via Ngrok)

---

## Location Integration

### Overview
Location services are integrated using **expo-location** package to request user GPS coordinates. Currently implemented in the Ambulance Screen.

### Permission Handling

**File:** `screens/AmbulanceScreen.jsx`

```javascript
import * as Location from 'expo-location';

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
```

#### Permission Flow
1. **Request Permission:** `requestForegroundPermissionsAsync()`
   - Shows system dialog asking user to allow location access
   
2. **Check Status:**
   - `status === 'granted'` → User allowed access
   - `status === 'denied'` → User denied access

3. **Get Position:** `getCurrentPositionAsync()`
   - Returns object with `coords` property
   - Contains: `latitude`, `longitude`, `altitude`, `accuracy`, etc.

4. **Store State:** `setUserLocation(location.coords)`
   - Saves location to component state
   - Available for use in emergency scenarios

### Location Data Structure
```javascript
userLocation = {
  latitude: 27.7172,      // User's latitude
  longitude: 85.3240,     // User's longitude
  altitude: 1300,         // Elevation in meters
  accuracy: 5.0,          // GPS accuracy in meters
  altitudeAccuracy: 10,
  heading: 0,
  speed: 0
}
```

### Use Cases (Current & Future)
1. **Identify Nearby Ambulance Services** - Filter services by distance
2. **Show Closest Hospital** - Display nearest medical facility
3. **Emergency Response** - Send location to ambulance dispatch center
4. **Navigation Integration** - Open maps with destination address

---

## System Flow Overview

### Complete Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APP STARTUP (_layout.tsx)                        │
│                                    │                                      │
│                         AuthProvider Wraps App                            │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┴────────────────┐
              │                                       │
        BOOTSTRAP ASYNC                               │
        ├─ Check AsyncStorage                        │
        │  for saved token & user                    │
        │                                            │
        └─► Token Found?                             │
            │                                        │
    ┌───────┴────────┐                               │
    │                │                               │
   YES              NO                               │
    │                │                               │
    ▼                ▼                               ▼
 RESTORE       STAY                    ┌──────────────────────┐
 SESSION       GUEST                   │   Set loading: false  │
    │                │                 │   Render Navigation   │
    │                │                 └──────────────────────┘
    │                │                           │
    └────┬───────────┘                           │
         │                                       │
         └──────────────────────┬────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
        ┌─────────────────┐           ┌─────────────────┐
        │  USER EXISTS    │           │  USER IS NULL   │
        │  (user state)   │           │  (user state)   │
        └────────┬────────┘           └────────┬────────┘
                 │                             │
                 ▼                             ▼
        ┌─────────────────┐           ┌─────────────────┐
        │  AUTHENTICATED  │           │   GUEST STACK   │
        │     STACK       │           │  (Login/Sign-up)│
        │   Render All    │           └────────┬────────┘
        │   App Features  │                    │
        └────────┬────────┘                    │
                 │                             │
                 │         USER SUBMITS        │
                 │         LOGIN FORM          │
                 │            │                │
                 │            ▼                │
                 │      ┌──────────┐           │
                 │      │API Call  │◄──────────┘
                 │      └────┬─────┘
                 │           │
                 │      ┌────┴─────┐
                 │      │           │
                 │  LOGIN SUCCESS  │
                 │      │           │
                 │      ▼           ▼
                 │  Token &    Error
                 │  User       Msg
                 │    │         │
                 │    ▼         ▼
                 │ AuthContext Alert
                 │  .login()   User
                 │    │      (Retry)
                 │    ▼
                 │ Update State
                 │    │
                 │    └──► AppNavigator
                 │         detects user
                 │         Change & Re-renders
                 │
                 └────────────────┘
                        │
                        ▼
        ┌──────────────────────────────┐
        │    HOME SCREEN (Main Hub)    │
        │                              │
        │   Quick Actions:             │
        │   1. Find Blood Donors       │
        │   2. Request Blood           │
        │   3. Donate Blood            │
        │   4. Volunteer               │
        │   5. View Profile            │
        │   6. Ambulance Services      │
        │   7. First Aid Info          │
        └──────────────────────────────┘
                        │
        ┌───────────────┼────────┬──────────┬──────────┐
        │               │        │          │          │
        ▼               ▼        ▼          ▼          ▼
    Profile        FindDonor BloodRequest Ambulance FirstAid
    Screen         Screen    Screen       Screen    Screen
```

### Key Decision Points

#### 1. **Loading State**
During bootstrap, `loading = true` displays:
```jsx
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  <ActivityIndicator size="large" color="#8B0000" />
</View>
```

#### 2. **Conditional Rendering**
```javascript
if (loading) {
  return <LoadingIndicator />;
}

return (
  <Stack.Navigator>
    {user ? (
      // Authenticated Stack
      <Stack.Screen name="Home" ... />
      // ... other authenticated screens
    ) : (
      // Guest Stack
      <Stack.Screen name="Login" ... />
      <Stack.Screen name="Register" ... />
    )}
  </Stack.Navigator>
);
```

#### 3. **Token Usage**
After login, token is included in all API requests:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
}
```

---

## Ambulance Screen Deep Dive

### Purpose
The Ambulance Screen provides:
- Emergency ambulance services (Red Cross, Police)
- Hospital services across Nepal
- Location-based filtering
- Direct phone calling functionality

### Screen Location
**File:** `screens/AmbulanceScreen.jsx`

### Component State
```javascript
const [searchQuery, setSearchQuery] = useState('');
const [selectedCity, setSelectedCity] = useState('all');
const [cityModal, setCityModal] = useState(false);
const [userLocation, setUserLocation] = useState(null);
```

### Data Structure - Ambulance Services

```javascript
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
  // ... 7 more hospitals in different cities
];
```

### Screen Sections

#### 1. Emergency Banner (Always Visible)
```jsx
<View style={styles.emergencyBanner}>
  <MaterialCommunityIcons name="ambulance" size={32} color="#fff" />
  <Text style={styles.emergencyTitle}>In Critical Emergency?</Text>
  <Text style={styles.emergencySubtext}>Call 102 for immediate help</Text>
  <TouchableOpacity onPress={() => Linking.openURL('tel:102')}>
    <Ionicons name="call" size={24} color="#fff" />
  </TouchableOpacity>
</View>
```

**Features:**
- Always at top for quick access
- Direct call button to 102
- Red color scheme for emergency visibility

#### 2. Search Bar
```jsx
<View style={styles.searchContainer}>
  <Ionicons name="search" size={20} color="#999" />
  <TextInput
    placeholder="Search hospital or service..."
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
</View>
```

**Functionality:**
- Real-time search filtering
- Searches service names (case-insensitive)

#### 3. City Filter Dropdown
```jsx
<TouchableOpacity onPress={() => setCityModal(true)}>
  <Text>{selectedCity === 'all' ? 'All' : selectedCity}</Text>
  <Ionicons name="chevron-down" size={18} />
</TouchableOpacity>
```

**Available Cities:**
- All (default)
- Nationwide
- Kathmandu
- Lalitpur
- Pokhara
- Dharan

#### 4. Services List

**Emergency Services Section:**
```jsx
<Text style={styles.sectionTitle}>Emergency Services</Text>
{filteredServices
  .filter((s) => s.type === 'emergency')
  .map((service) => (
    <View key={service.id} style={styles.serviceCard}>
      {/* Service details */}
    </View>
  ))}
```

**Hospital Services Section:**
- Filtered by city selection
- Shows address and availability

### Filtering Logic

```javascript
const filteredServices = ambulanceServices.filter((service) => {
  const matchesSearch = service.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase());
  const matchesCity =
    selectedCity === 'all' || 
    service.city.toLowerCase() === selectedCity.toLowerCase();
  return matchesSearch && matchesCity;
});
```

**Two-level filtering:**
1. **Text Search:** Name contains query string
2. **City Filter:** Exact city match OR "all" selected

### Emergency Call Handler

```javascript
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
```

**Flow:**
1. User taps service card
2. Confirmation dialog shown
3. On confirmation, phone dialer opens with pre-filled number
4. User can make the call or cancel

### Navigation Integration

**From HomeScreen:**
```javascript
navigation.navigate('Ambulance');
```

**Screen Options:**
```javascript
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
```

---

## Technology Stack

### Frontend Stack

| Technology | Purpose | Usage |
|-----------|---------|-------|
| **React Native** | Mobile framework | Core app development |
| **Expo** | Development platform | Project scaffolding, build tools |
| **React Navigation** | Screen navigation | Stack-based routing system |
| **React Context API** | State management | Global auth state |
| **AsyncStorage** | Local persistence | Save token & user data |
| **Fetch API** | HTTP requests | Backend communication |
| **expo-location** | GPS coordinates | Get user location |
| **react-native-safe-area-context** | Safe layout | Notch/status bar handling |
| **Expo Icons** | UI icons | Ionicons, MaterialCommunityIcons |

### Backend Stack

| Technology | Purpose | Usage |
|-----------|---------|-------|
| **Node.js** | Runtime | Server-side execution |
| **Express.js** | Web framework | API endpoints |
| **Ngrok** | Tunneling | Expose local backend to mobile app |
| **JWT** | Authentication | Token-based auth |
| **MongoDB** (assumed) | Database | Data persistence |

### API Endpoints

**Base URL:** `https://tularaemic-electroneutral-ozella.ngrok-free.dev/api`

#### Auth Endpoints
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/register` | {email, password, ...} | {token, user} |
| POST | `/auth/login` | {email, password} | {token, user} |
| GET | `/auth/profile` | (Header: Bearer token) | {user} |
| PUT | `/auth/profile` | {profile fields} | {user} |
| PUT | `/auth/change-password` | {old, new password} | {success} |

#### Blood Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/blood/requests` | Fetch all blood requests |
| POST | `/blood/requests` | Create new request |
| GET | `/blood/donors` | Search donors |
| POST | `/blood/donate` | Register new donation |

---

## Screen Navigation Guide

### Quick Reference - Navigation Methods

#### From Any Screen Component
```javascript
// Using passed navigation prop
const MyScreen = ({ navigation }) => {
  // Navigate to another screen
  navigation.navigate('Home');
  
  // Go back to previous screen
  navigation.goBack();
  
  // Reset stack
  navigation.reset({
    index: 0,
    routes: [{ name: 'Home' }]
  });
};
```

#### Common Navigation Patterns

**1. Go from Home to Ambulance:**
```javascript
<TouchableOpacity onPress={() => navigation.navigate('Ambulance')}>
  <Text>Ambulance Services</Text>
</TouchableOpacity>
```

**2. Go from Ambulance back to Home:**
```javascript
<TouchableOpacity onPress={() => navigation.goBack()}>
  <Text>Back</Text>
</TouchableOpacity>
```

**3. Access user data on any authenticated screen:**
```javascript
const MyScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  
  return (
    <View>
      <Text>Hello, {user.name}</Text>
    </View>
  );
};
```

### Screen Hierarchy

**Level 0 (Entry):**
- Login / Register (Guest)
- Home (Authenticated)

**Level 1 (Main Features):**
- Profile, FindDonor, BloodRequest, Ambulance, FirstAid, Donation

**Level 2 (Sub-features):**
- EditProfile, ChangePassword, BloodRequestsFeed

### Navigation Flow Summary

```
Unauthenticated:
  Login ──┬──→ Register
          │
          └──→ (Auto Navigate to Home on Success)

Authenticated:
  Home ──┬──→ Profile ──→ EditProfile
         │               └─→ ChangePassword
         │
         ├──→ FindDonor
         ├──→ BloodRequest ──→ BloodRequestsFeed
         ├──→ Ambulance
         ├──→ FirstAid
         └──→ Donation

Every screen has:
  - Header with back button (except Home)
  - Top navigation to core sections
  - All screens check auth context on load
```

---

## Summary

AshaSetu implements a **context-based authentication system** with a conditional render pattern for screen stacks. The app prioritizes user state management through AsyncStorage and AsyncContext, enabling seamless login persistence and session restoration.

Location services are integrated through expo-location, providing GPS coordinates for emergency scenarios. The ambulance screen demonstrates how local data can be filtered and displayed with emergency call functionality.

The entire system flows through:
1. **Authentication** (Controlled by AuthContext)
2. **Navigation** (Conditional stack rendering)
3. **API Communication** (Ngrok-tunneled backend)
4. **Location Services** (GPS-based features)
5. **User Interaction** (Screens with business logic)

Each component is modular and follows React best practices for scalability and maintainability.

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Project:** AshaSetu Blood Donation & Emergency Services Platform
