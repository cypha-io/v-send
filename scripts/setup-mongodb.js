#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up MongoDB for V-Send Wallet App\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating one...');
  
  // Create .env file with default values
  const envContent = `# MongoDB Configuration
# For development, you can use:
# 1. MongoDB Atlas (free tier): https://cloud.mongodb.com/
# 2. Local MongoDB: mongodb://localhost:27017/vsend-wallet
# 3. MongoDB Docker: mongodb://localhost:27017/vsend-wallet

# Replace this with your actual MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/vsend-wallet

# For production, use MongoDB Atlas or your cloud provider
# Example Atlas connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vsend-wallet?retryWrites=true&w=majority
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default MongoDB configuration');
}

console.log('\n📋 MongoDB Setup Options:\n');

console.log('1. 🌐 MongoDB Atlas (Recommended for production)');
console.log('   - Visit: https://cloud.mongodb.com/');
console.log('   - Create a free cluster');
console.log('   - Get your connection string');
console.log('   - Update MONGODB_URI in .env file\n');

console.log('2. 🐳 Local MongoDB with Docker');
console.log('   - Run: docker run -d -p 27017:27017 --name vsend-mongo mongo:latest');
console.log('   - Connection string: mongodb://localhost:27017/vsend-wallet\n');

console.log('3. 💻 Local MongoDB Installation');
console.log('   - Install MongoDB Community Server');
console.log('   - Start MongoDB service');
console.log('   - Connection string: mongodb://localhost:27017/vsend-wallet\n');

console.log('📝 Database Schema:');
console.log('   - The app will automatically create collections and indexes');
console.log('   - Collections: users, walletaccounts, transactions, pins, authtokens');
console.log('   - No manual setup required!\n');

console.log('🔧 Next Steps:');
console.log('   1. Update MONGODB_URI in .env file');
console.log('   2. Run: npm start');
console.log('   3. The app will handle database initialization\n');

console.log('✅ Setup complete! Your wallet app is ready to use MongoDB.');
