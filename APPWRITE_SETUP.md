# Appwrite Database Setup Guide

This guide will help you automatically set up the Appwrite database for the Device Charging Management System.

## Quick Start

### 1. Get Your Appwrite Credentials

You need three things from Appwrite:

#### Option A: Using Appwrite Cloud (Recommended for beginners)

1. Go to [Appwrite Cloud](https://cloud.appwrite.io)
2. Create a new account or sign in
3. Create a new project
4. Get your **Project ID**:
   - Go to Settings > Project ID
   - Copy the ID
5. Create an API Key:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Give it a name like "Device Charging Setup"
   - Check these scopes:
     - databases.read
     - databases.write
     - collections.read
     - collections.write
     - attributes.read
     - attributes.write
     - documents.read
     - documents.write
   - Create and copy the API key

#### Option B: Using Self-Hosted Appwrite

1. Set up Appwrite on your server
2. Access your Appwrite Console
3. Create a new project (or use existing)
4. Follow the same steps as above to get Project ID and API Key

### 2. Setup Environment Variables

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your credentials:
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io
VITE_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
VITE_APPWRITE_DATABASE_ID=devices
VITE_APPWRITE_DEVICES_COLLECTION_ID=registered_devices
```

### 3. Run the Setup Script

Run the bash script to automatically create the database and collections:

```bash
bash ./bash.sh
```

The script will:
- ✅ Connect to Appwrite
- ✅ Create the `devices` database
- ✅ Create the `registered_devices` collection
- ✅ Set up all required attributes (fields)
- ✅ Create indexes for fast queries

You should see output like:
```
╔════════════════════════════════════════════════════════════════════════════╗
║                    APPWRITE DATABASE SETUP IN PROGRESS                     ║
╚════════════════════════════════════════════════════════════════════════════╝

🔍 Testing Appwrite connectivity...
✅ Connected to Appwrite

📝 Creating database...
✅ Created: Database: devices

📝 Creating collection...
✅ Created: Collection: registered_devices

📋 Creating attributes for RegisteredDevice...
✅ Created: Attribute: qrData (string)
✅ Created: Attribute: fingerprintId (string)
✅ Created: Attribute: status (string)
...

╔════════════════════════════════════════════════════════════════════════════╗
║                      ✅ SETUP COMPLETED SUCCESSFULLY                       ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### 4. Start Your Application

```bash
npm install
npm run dev
```

## Database Schema

The setup script creates a collection with these attributes:

### Device Identification
- **qrData** (string): QR code data for the device
- **fingerprintId** (string): Biometric fingerprint identifier
- **registrationMethod** (string): How device was registered (qr or fingerprint)

### Device Status
- **status** (string): Current status (charging, completed)
- **paymentStatus** (string): Payment status (PAID, PAY LATER)
- **slotNumber** (integer): Charging slot number (1-1000)

### Device Information
- **username** (string): User who registered the device
- **deviceName** (string): Name given to the device
- **deviceType** (string): Type of device (Phone, Power Bank, E-Scooter, E-Bike, EV, PC)
- **price** (integer): Price/deposit amount
- **photoUrl** (string): URL to device photo

### Timestamps
- **registeredAt** (datetime): When device was registered
- **retrievedAt** (datetime): When device was retrieved
- **pickupDate** (string): Scheduled pickup date
- **registeredAtTime** (string): Formatted registration time
- **retrievedAtTime** (string): Formatted retrieval time

### Data Sync
- **payload** (string): JSON payload for web/mobile synchronization

## Indexes Created

For optimal query performance, these indexes are created:

- **qrData_unique**: Unique index on qrData for fast lookups
- **status**: Index for querying by device status
- **registeredAt_desc**: Descending index for recent registrations
- **slotNumber**: Index for slot availability checks
- **paymentStatus**: Index for payment status queries

## Troubleshooting

### Script Fails to Connect

```
❌ ERROR: Cannot reach Appwrite endpoint at https://cloud.appwrite.io
```

**Solutions:**
1. Check your internet connection
2. Verify APPWRITE_ENDPOINT is correct
3. Make sure Appwrite is running (if self-hosted)

### Invalid API Key

```
❌ Error: Unauthorized
```

**Solutions:**
1. Verify your API key in .env.local
2. Check that the API key has the required scopes
3. Regenerate the API key in Appwrite Console

### Database Already Exists

```
⏭️  Exists: Database: devices
```

This is normal! The script safely skips existing resources.

### Missing Required Attributes

If you get an error about missing attributes:

1. Make sure the API key has `attributes.write` scope
2. Try running the script again

## Using the Database in Your App

The application automatically uses these environment variables:

```typescript
const endpoint = process.env.VITE_APPWRITE_ENDPOINT
const projectId = process.env.VITE_APPWRITE_PROJECT_ID
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID
const devicesCollectionId = process.env.VITE_APPWRITE_DEVICES_COLLECTION_ID
```

See `src/utils/appwriteRest.ts` for API integration examples.

## Advanced: Custom Database/Collection IDs

If you want to use different database or collection IDs:

```bash
APPWRITE_ENDPOINT="https://cloud.appwrite.io" \
APPWRITE_PROJECT_ID="your_project_id" \
APPWRITE_API_KEY="your_api_key" \
APPWRITE_DATABASE_ID="my_custom_db" \
APPWRITE_COLLECTION_ID="my_custom_collection" \
bash ./bash.sh
```

Then update .env.local:
```env
VITE_APPWRITE_DATABASE_ID=my_custom_db
VITE_APPWRITE_DEVICES_COLLECTION_ID=my_custom_collection
```

## Getting Help

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite API Reference](https://appwrite.io/docs/references)
- [Appwrite Community Discord](https://discord.gg/appwrite)

