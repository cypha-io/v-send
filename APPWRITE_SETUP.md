# 🚀 Appwrite Migration Guide - V-Send Wallet

Your wallet app is now configured to use **Appwrite** as the backend database! This will give you a proper cloud database with automatic schema management.

## 📋 **Quick Setup Steps**

### **1. Create Appwrite Account**
1. Go to [Appwrite Cloud](https://cloud.appwrite.io)
2. Sign up for a free account
3. Create a new project called "V-Send Wallet"

### **2. Get Your Project Configuration**
After creating your project, you'll see:
- **Project ID**: Copy this (looks like: `65f1a2b3c4d5e6f7`)
- **API Endpoint**: Should be `https://cloud.appwrite.io/v1`

### **3. Update Environment Variables**
Edit your `.env` file and replace the placeholder:

```bash
# Replace 'your-project-id-here' with your actual Project ID
EXPO_PUBLIC_APPWRITE_PROJECT_ID=65f1a2b3c4d5e6f7
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

### **4. Create Database Collections**

In your Appwrite console, create these collections manually:

#### **4.1. Create Database**
1. Go to **Databases** → **Create Database**
2. Database ID: `v-send-wallet-db`
3. Name: `V-Send Wallet Database`

#### **4.2. Create Collections**

**Collection 1: users**
- Collection ID: `users`
- Name: `Users`
- Permissions: Allow all for now (you can restrict later)

Add these attributes:
```
phoneNumber (String, size: 20, required: true)
firstName (String, size: 50, required: false)
lastName (String, size: 50, required: false)
email (String, size: 100, required: false)
role (String, size: 20, required: true, default: "user")
isVerified (Boolean, required: true, default: false)
isActive (Boolean, required: true, default: true)
lastLoginAt (DateTime, required: false)
```

**Collection 2: wallet-accounts**
- Collection ID: `wallet-accounts`
- Name: `Wallet Accounts`

Add these attributes:
```
userId (String, size: 50, required: true)
accountNumber (String, size: 20, required: true)
balance (Float, min: 0, max: 999999999.99, required: true, default: 0)
currency (String, size: 10, required: true, default: "USD")
status (String, size: 20, required: true, default: "active")
isDefault (Boolean, required: true, default: true)
dailyLimit (Float, min: 0, max: 999999999.99, required: true, default: 10000)
monthlyLimit (Float, min: 0, max: 999999999.99, required: true, default: 100000)
lastTransactionAt (DateTime, required: false)
```

**Collection 3: transactions**
- Collection ID: `transactions`
- Name: `Transactions`

Add these attributes:
```
walletAccountId (String, size: 50, required: true)
type (String, size: 20, required: true)
amount (Float, min: 0.01, max: 999999999.99, required: true)
description (String, size: 500, required: false)
reference (String, size: 50, required: true)
status (String, size: 20, required: true, default: "completed")
recipientPhone (String, size: 20, required: false)
metadata (String, size: 2000, required: false)
```

**Collection 4: pins**
- Collection ID: `pins`
- Name: `PINs`

Add these attributes:
```
userId (String, size: 50, required: true)
hashedPin (String, size: 128, required: true)
salt (String, size: 64, required: true)
isActive (Boolean, required: true, default: true)
lastUsedAt (DateTime, required: false)
```

**Collection 5: auth-tokens**
- Collection ID: `auth-tokens`
- Name: `Auth Tokens`

Add these attributes:
```
userId (String, size: 50, required: true)
token (String, size: 128, required: true)
deviceInfo (String, size: 500, required: false)
isActive (Boolean, required: true, default: true)
expiresAt (DateTime, required: true)
lastUsedAt (DateTime, required: false)
```

### **5. Update Your App to Use Appwrite**

Update your wallet context to use Appwrite service:

```typescript
// In contexts/WalletContext.tsx
import { WalletService } from '@/services/appwriteWallet';
import { StorageService } from '@/services/appwriteStorage';
```

## 🔧 **Migration from AsyncStorage**

Your app currently uses AsyncStorage. After setting up Appwrite:

1. **Test the Setup**: Run the app and try creating a user
2. **Data Migration**: Your existing AsyncStorage data will remain, but new data will go to Appwrite
3. **Gradual Migration**: You can gradually move existing users to Appwrite

## ✅ **What You Get with Appwrite**

### **🌐 Cloud Database**
- ✅ **Real Cloud Storage**: Data stored in Appwrite's secure cloud
- ✅ **Automatic Backups**: Built-in data protection
- ✅ **Scalability**: Handles millions of users
- ✅ **Real-time Updates**: Live data synchronization

### **🔐 Security Features**
- ✅ **Built-in Authentication**: Secure user management
- ✅ **Permissions System**: Fine-grained access control
- ✅ **Data Encryption**: Encrypted data at rest and in transit
- ✅ **API Key Management**: Secure API access

### **📊 Advanced Features**
- ✅ **Database Relationships**: Advanced querying capabilities
- ✅ **File Storage**: Upload user documents/images
- ✅ **Functions**: Server-side business logic
- ✅ **Real-time Subscriptions**: Live data updates

### **🛠 Developer Experience**
- ✅ **Web Console**: Manage data through web interface
- ✅ **REST API**: Direct API access
- ✅ **SDKs**: Native React Native integration
- ✅ **Analytics**: Usage and performance metrics

## 🚦 **Quick Test**

After setup, your app will automatically:

1. **Connect to Appwrite**: Uses your project configuration
2. **Create Users**: New users saved to cloud database
3. **Wallet Operations**: All transactions stored in Appwrite
4. **Real-time Sync**: Data synced across devices

## 🆘 **Need Help?**

If you encounter any issues:

1. **Check Project ID**: Ensure it's correctly set in `.env`
2. **Verify Collections**: Make sure all 5 collections are created
3. **Check Permissions**: Collections should allow read/write access
4. **Console Logs**: Check React Native logs for connection errors

## 🎯 **Next Steps**

Once Appwrite is working:

1. **Add Indexes**: Create database indexes for better performance
2. **Set Permissions**: Restrict access to user's own data
3. **Add Validation**: Server-side data validation
4. **Enable Real-time**: Live updates across devices
5. **Add Functions**: Server-side business logic

---

**🎉 Your V-Send wallet app will now have a production-ready cloud database with Appwrite!**
