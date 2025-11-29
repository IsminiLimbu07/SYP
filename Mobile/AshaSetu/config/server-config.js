/**
 * SERVER CONFIGURATION
 * 
 * This file allows you to easily switch between different server configurations
 * based on your environment (local development, different networks, production, etc.)
 */

// ==========================================
// DEVELOPMENT CONFIGURATION
// ==========================================

const DEVELOPMENT_SERVERS = {
  // Your current home/office network
  home: {
    name: 'Home Network',
    ip: '192.168.56.1',
    port: 9000,
    url: 'http://192.168.56.1:9000/api',
    description: 'Main development server at home'
  },
  
  // Alternative network addresses (in case IP changes)
  office: {
    name: 'Office Network',
    ip: '192.168.1.100', // Change this to your office network IP
    port: 9000,
    url: 'http://192.168.1.100:9000/api',
    description: 'Alternative office network'
  },

  // Local testing (web/simulator only)
  local: {
    name: 'Local Machine',
    ip: 'localhost',
    port: 9000,
    url: 'http://localhost:9000/api',
    description: 'For web testing only'
  }
};

// ==========================================
// PRODUCTION CONFIGURATION
// ==========================================

const PRODUCTION_SERVER = {
  name: 'Production Server',
  domain: 'api.ashasetu.com',
  url: 'https://api.ashasetu.com/api', // Change to your actual production domain
  description: 'Live production server'
};

// ==========================================
// ACTIVE CONFIGURATION
// ==========================================

// SELECT WHICH SERVER TO USE
// Options: 'home', 'office', 'local', or 'production'
const ACTIVE_SERVER = 'home';

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

export const getServerConfig = () => {
  if (ACTIVE_SERVER === 'production') {
    return PRODUCTION_SERVER;
  }
  
  const server = DEVELOPMENT_SERVERS[ACTIVE_SERVER];
  if (!server) {
    console.warn(`Server '${ACTIVE_SERVER}' not found. Using 'home'.`);
    return DEVELOPMENT_SERVERS.home;
  }
  
  return server;
};

export const getApiUrl = () => {
  return getServerConfig().url;
};

export const switchServer = (serverName) => {
  console.log(`Switching to server: ${serverName}`);
  // This would require state management to work dynamically
  // For now, just change ACTIVE_SERVER above
};

export const listAvailableServers = () => {
  return {
    development: Object.keys(DEVELOPMENT_SERVERS),
    production: 'production'
  };
};

// Export all servers for debugging
export { DEVELOPMENT_SERVERS, PRODUCTION_SERVER };
export default getServerConfig();
