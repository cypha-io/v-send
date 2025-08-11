import { Account, Client, Databases, Functions, ID, Storage } from 'react-native-appwrite';

// Appwrite configuration
export const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  platform: 'com.vsend.wallet', // Replace with your bundle identifier
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '', // Set this in your .env file
  databaseId: 'v-send-wallet-db',
  
  // Collection IDs - these will be created automatically
  collections: {
    users: 'users',
    walletAccounts: 'wallet-accounts',
    transactions: 'transactions',
    pins: 'pins',
    authTokens: 'auth-tokens',
    receipts: 'receipts'
  },
  
  // Storage bucket for any files (optional)
  bucketId: 'wallet-files'
};

// Initialize Appwrite client
const client = new Client();

// Set project configuration
client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Export client for advanced usage
export default client;

// Utility to generate unique IDs
export { ID };
