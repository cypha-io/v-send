# 🔧 Platform Registration - Fix Required

## ❌ Current Issue

Your app is getting this error:

```
Invalid Origin. Register your new client (com.vsend.wallet) as a new iOS platform on your project console dashboard
```

## ✅ Quick Fix

You need to register your app's platform in the Appwrite console:

### **Step 1: Go to Appwrite Console**

1. Open [Appwrite Console](https://cloud.appwrite.io)
2. Select your project: `68949dba003cf43244f8`

### **Step 2: Add iOS Platform**

1. Go to **Settings** → **Platforms**
2. Click **"Add Platform"**
3. Select **"iOS App"**
4. Fill in the details:
   - **Name**: `V-Send Wallet iOS`
   - **Bundle ID**: `com.vsend.wallet`
   - Leave other fields as default

### **Step 3: Add Web Platform (for Expo Go)**

1. Click **"Add Platform"** again
2. Select **"Web App"**
3. Fill in the details:
   - **Name**: `V-Send Wallet Web`
   - **Hostname**: `localhost`

### **Step 4: Add Android Platform (Optional)**

1. Click **"Add Platform"** again
2. Select **"Android App"**  
3. Fill in the details:
   - **Name**: `V-Send Wallet Android`
   - **Package Name**: `com.vsend.wallet`

## 🎯 Alternative: Update Bundle ID

If you prefer, you can change the bundle ID in your app to match an existing platform:

1. Edit `/config/appwrite.ts`
2. Change the `platform` field:

   ```typescript
   platform: 'your.existing.bundle.id'
   ```

## 🚀 After Registration

Once you've added the platforms:

1. Wait 1-2 minutes for changes to propagate
2. Restart your Expo development server
3. Test your app again

The authorization errors should be resolved!
