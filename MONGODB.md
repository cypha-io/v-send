# MongoDB Integration for V-Send Wallet

This document explains how to set up and use MongoDB with your V-Send wallet application.

## 🚀 Quick Setup

Run the setup script to get started:

```bash
npm run setup-mongodb
```

## 📊 Database Architecture

The app automatically creates the following MongoDB collections:

### Collections

1. **users** - User account information
   - User profile data
   - Phone numbers
   - Authentication details
   - User roles (user/admin)

2. **walletaccounts** - Wallet account data
   - Account balances
   - Account numbers
   - Transaction limits
   - Account status

3. **transactions** - Transaction history
   - All wallet transactions
   - Transaction types (credit, debit, transfer, etc.)
   - Transaction status and metadata
   - Automatic indexing for performance

4. **pins** - Secure PIN storage
   - Hashed PINs using SHA256
   - User-PIN associations

5. **authtokens** - Session management
   - Authentication tokens
   - Token expiration
   - Device information

### Automatic Indexing

The app creates optimized indexes for:
- User lookups by phone number
- Transaction queries by wallet account
- Fast authentication checks
- Efficient transaction history retrieval

## 🌐 MongoDB Setup Options

### Option 1: MongoDB Atlas (Recommended)

1. Visit [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vsend-wallet?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB with Docker

```bash
# Start MongoDB container
docker run -d -p 27017:27017 --name vsend-mongo mongo:latest

# Update .env file
MONGODB_URI=mongodb://localhost:27017/vsend-wallet
```

### Option 3: Local MongoDB Installation

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Update `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/vsend-wallet
   ```

## 🔧 Configuration

### Environment Variables

Create or update your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vsend-wallet

# For production, use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vsend-wallet?retryWrites=true&w=majority
```

### Connection Features

- **Automatic Reconnection**: The app handles connection drops gracefully
- **Schema Validation**: Automatic schema creation and validation
- **Index Optimization**: Performance indexes created automatically
- **Error Handling**: Robust error handling with fallback options

## 📱 App Integration

### Automatic Features

1. **Database Initialization**: Runs automatically on app startup
2. **Schema Creation**: Creates collections and indexes automatically
3. **Data Migration**: Seamlessly migrates from local storage
4. **Real-time Sync**: All data is immediately synced to MongoDB

### Service Architecture

```typescript
// MongoDB Services
MongoStorageService    // Low-level database operations
MongoWalletService     // Business logic with MongoDB
WalletContext         // React context with MongoDB integration
```

## 🔍 Monitoring and Debugging

### Connection Status

The app provides connection status logging:

```
✅ Connected to MongoDB successfully
✅ Database schema ensured successfully
```

### Health Checks

Built-in health check methods:
- Database connection status
- Schema validation
- Performance monitoring

### Error Handling

- Graceful fallback to local storage if MongoDB is unavailable
- Detailed error logging for debugging
- Automatic retry mechanisms

## 🚀 Data Migration

### From Local Storage

The app automatically handles data migration:

1. Existing local data is preserved
2. New data is stored in MongoDB
3. Seamless transition without data loss

### Production Deployment

For production deployment:

1. Use MongoDB Atlas for reliability
2. Set up proper authentication
3. Configure connection pooling
4. Enable monitoring and alerts

## 📊 Performance Optimization

### Indexes

Automatically created indexes for:
- User phone number lookups
- Transaction history queries
- Authentication token verification
- Account balance updates

### Connection Pooling

Mongoose handles connection pooling automatically:
- Efficient resource usage
- Automatic connection management
- Optimized query performance

## 🔒 Security Features

### Data Protection

- PIN hashing with SHA256
- Secure token storage
- Encrypted connections (TLS)
- Input validation and sanitization

### Access Control

- User-level data isolation
- Secure authentication flows
- Token-based session management
- Automatic token expiration

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MongoDB URI in `.env`
   - Verify MongoDB service is running
   - Check network connectivity

2. **Schema Errors**
   - App will recreate collections automatically
   - Check console for detailed error messages

3. **Performance Issues**
   - Indexes are created automatically
   - Monitor connection pool usage
   - Check query patterns

### Support

For issues or questions:
- Check console logs for detailed errors
- Verify MongoDB connection string
- Ensure MongoDB service is accessible

## 🎯 Next Steps

1. **Setup MongoDB**: Choose your preferred option above
2. **Update Configuration**: Set your connection string in `.env`
3. **Run the App**: Use `npm start` to launch with MongoDB
4. **Monitor Performance**: Check logs for connection status
5. **Scale as Needed**: Upgrade to MongoDB Atlas for production

Your wallet app is now ready to use MongoDB for persistent, scalable data storage! 🚀
