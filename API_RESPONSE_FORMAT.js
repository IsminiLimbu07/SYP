// Response Format Documentation
// This shows what the backend returns and how the frontend handles it

/**
 * REGISTRATION Response Example
 */
export const REGISTER_RESPONSE = {
  success: true,
  message: "User registered successfully",
  data: {
    user: {
      user_id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      phone_number: "9800123456",
      is_admin: false,
      created_at: "2025-01-15T10:30:00Z"
    },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
};

/**
 * LOGIN Response Example
 */
export const LOGIN_RESPONSE = {
  success: true,
  message: "Login successful",
  data: {
    user: {
      user_id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      phone_number: "9800123456",
      is_admin: false,
      is_verified: false,
      is_active: true,
      created_at: "2025-01-15T10:30:00Z",
      profile: {
        profile_id: 1,
        user_id: 1,
        date_of_birth: null,
        gender: null,
        profile_picture_url: null,
        location_lat: null,
        location_lng: null,
        address: null,
        city: null,
        blood_group: null,
        willing_to_donate_blood: false,
        available_to_donate: true,
        willing_to_volunteer: false,
        volunteer_skills: null,
        volunteer_availability: "available",
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_conditions: null,
        allergies: null,
        updated_at: "2025-01-15T10:30:00Z"
      }
    },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
};

/**
 * GET PROFILE Response Example
 */
export const GET_PROFILE_RESPONSE = {
  success: true,
  message: "Profile retrieved successfully",
  data: {
    user: {
      user_id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      phone_number: "9800123456",
      is_admin: false,
      is_verified: false,
      is_active: true,
      created_at: "2025-01-15T10:30:00Z",
      profile: {
        // profile data...
      }
    }
  }
};

/**
 * UPDATE PROFILE Response Example
 */
export const UPDATE_PROFILE_RESPONSE = {
  success: true,
  message: "Profile updated successfully",
  data: {
    user: {
      user_id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      phone_number: "9800123456",
      is_admin: false,
      is_verified: false,
      is_active: true,
      created_at: "2025-01-15T10:30:00Z",
      profile: {
        // updated profile data...
      }
    }
  }
};

/**
 * CHANGE PASSWORD Response Example
 */
export const CHANGE_PASSWORD_RESPONSE = {
  success: true,
  message: "Password changed successfully",
  data: {}
};

/**
 * ERROR Response Example
 */
export const ERROR_RESPONSE = {
  success: false,
  message: "Invalid email or password",
  // status: 401
};

/**
 * Frontend Implementation Example
 */

// In your component:
const handleLogin = async () => {
  try {
    // Call the API
    const response = await loginUser({ email, password });
    
    // Response structure:
    // {
    //   success: true,
    //   message: "Login successful",
    //   token: "JWT_TOKEN_HERE",
    //   user: { user_id, email, ... }
    // }

    if (response.success) {
      // Token and user are already extracted by the API function
      await login(response.token, response.user);
      
      // User is now stored in context and AsyncStorage
      // You can access it with useContext(AuthContext)
    }
  } catch (error) {
    // Error message from backend is automatically thrown
    Alert.alert('Error', error.message);
  }
};

/**
 * Accessing User Data in Components
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MyComponent() {
  const { user, token, isAuthenticated, logout } = useContext(AuthContext);

  return (
    <View>
      {isAuthenticated ? (
        <>
          <Text>Welcome, {user?.full_name}</Text>
          <Text>Email: {user?.email}</Text>
          <TouchableOpacity onPress={logout}>
            <Text>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>Please login</Text>
      )}
    </View>
  );
}

/**
 * Making Protected Requests
 */

// Example: Update user profile
const updateUserProfile = async (profileData) => {
  const { token } = useContext(AuthContext);
  
  try {
    const response = await updateProfile(token, profileData);
    
    // Update context with new user data
    await updateUser(response.user);
    
    return response;
  } catch (error) {
    console.error('Profile update failed:', error.message);
  }
};

/**
 * Token Format
 */
export const TOKEN_INFO = {
  type: "JWT (JSON Web Token)",
  format: "Bearer token",
  usage: "Authorization: Bearer <token>",
  expiration: "7 days",
  payload: {
    user_id: 1,
    email: "user@example.com",
    is_admin: false,
    iat: 1234567890,
    exp: 1234654290
  }
};

/**
 * Required Headers for Protected Requests
 */
export const PROTECTED_REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

/**
 * Error Codes & Messages
 */
export const ERROR_CODES = {
  400: "Bad Request - Invalid input",
  401: "Unauthorized - Invalid credentials or token expired",
  403: "Forbidden - Account deactivated",
  404: "Not Found - User not found",
  409: "Conflict - User already exists",
  500: "Server Error - Try again later"
};
