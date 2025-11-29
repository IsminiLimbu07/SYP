import { useEffect, useState } from 'react';

// Get API URL based on environment
export const getApiUrl = () => {
  // For production, use your domain/server
  // For development, detect environment automatically
  
  // Option 1: Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Option 2: Detect based on __DEV__
  if (__DEV__) {
    // During development, use your current machine IP
    // Change this when you move to a different network
    return 'http://192.168.56.1:9000/api';
  }

  // Option 3: For production, use your actual server/domain
  return 'https://api.ashasetu.com/api'; // Replace with your production domain
};

// Auto-detect network changes (optional - for future use)
export const useNetworkDetection = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default getApiUrl;
