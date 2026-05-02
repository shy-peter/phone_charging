# 🚀 Appwrite Database Setup - Quick Reference

## 📋 Overview

This project uses **Appwrite** as the backend database for the Device Charging Management System. The setup is fully automated through the `bash.sh` script.

## ⚡ Quick Start (5 minutes)

### Windows Users

**Option 1: PowerShell (Recommended)**
```powershell
.\setup-appwrite.ps1
```

**Option 2: Batch (CMD)**
```cmd
setup-appwrite.bat
```

### Mac/Linux Users

```bash
bash ./bash.sh
```

### Manual Setup

```bash
# 1. Copy environment template
cp .env.local.example .env.local

# 2. Edit with your Appwrite credentials
nano .env.local  # or use your favorite editor

# 3. Run setup
bash ./bash.sh

# 4. Install and start
npm install
npm run dev
```

## 🔑 Getting Appwrite Credentials (2 minutes)

### 1. Sign Up / Log In
- Go to https://cloud.appwrite.io
- Create account or sign in

### 2. Create Project
- Click "Create Project"
- Name it (e.g., "Device Charging")
- Create

### 3. Get Project ID
- Go to **Settings** (gear icon)
- Copy **Project ID**

### 4. Create API Key
- Go to **Settings** > **API Keys**
- Click "Create API Key"
- Name: "Device Charging Setup"
- Check these scopes:
  - ✅ databases.read
  - ✅ databases.write
  - ✅ collections.read
  - ✅ collections.write
  - ✅ attributes.read
  - ✅ attributes.write
  - ✅ documents.read
  - ✅ documents.write
- Create and copy the key

### 5. Update .env.local
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io
VITE_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
```

## 📁 Files Created/Modified

| File | Purpose |
|------|---------|
| `bash.sh` | Main setup script (enhanced) |
| `.env.local.example` | Environment variables template |
| `APPWRITE_SETUP.md` | Detailed setup guide |
| `setup-appwrite.bat` | Windows batch helper |
| `setup-appwrite.ps1` | Windows PowerShell helper |
| `APPWRITE_QUICK_REF.md` | This file |

## 📊 Database Schema

**Database:** `devices`  
**Collection:** `registered_devices`

### Attributes Created

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| qrData | string | No | QR code data |
| fingerprintId | string | No | Biometric ID |
| status | string | Yes | charging \| completed |
| paymentStatus | string | Yes | PAID \| PAY LATER |
| slotNumber | integer | Yes | 1-1000 |
| username | string | No | User name |
| deviceName | string | No | Device name |
| deviceType | string | No | Phone, Power Bank, etc. |
| price | integer | No | Price/deposit |
| photoUrl | string | No | Device photo URL |
| registeredAt | datetime | Yes | Registration timestamp |
| retrievedAt | datetime | No | Retrieval timestamp |
| pickupDate | string | No | Scheduled pickup |
| registeredAtTime | string | No | Formatted time |
| retrievedAtTime | string | No | Formatted time |
| payload | string | No | JSON payload (sync) |

### Indexes Created

- `qrData_unique` - Fast QR lookups
- `status` - Query by status
- `registeredAt_desc` - Recent registrations
- `slotNumber` - Slot availability
- `paymentStatus` - Payment queries

## 🐛 Troubleshooting

### "bash is not available"
→ Install Git Bash, WSL, or MSYS2

### "Cannot reach Appwrite endpoint"
→ Check internet connection and endpoint URL

### "Unauthorized" error
→ Verify API key and scopes in Appwrite Console

### "Already exists" (OK!)
→ Normal when re-running - script skips existing resources

## 📖 Documentation

- **Full Setup Guide:** [APPWRITE_SETUP.md](./APPWRITE_SETUP.md)
- **Appwrite Docs:** https://appwrite.io/docs
- **Project Structure:** See [project structure](./README.md)

## ✅ Verification

After running setup, check:

```bash
# 1. Environment file
cat .env.local | grep APPWRITE

# 2. Try fetching devices (in browser console or test)
npm run dev
# App should load without errors
```

## 🔐 Security Notes

- Never commit `.env.local` to git
- Keep API key secret
- Use strong API key permissions
- Rotate keys periodically
- For production, use more restricted scopes

## 📞 Support

- 📚 [Full Setup Guide](./APPWRITE_SETUP.md)
- 🔗 [Appwrite Documentation](https://appwrite.io/docs)
- 💬 [Appwrite Community](https://discord.gg/appwrite)

## 🎯 Next Steps

1. ✅ Run setup script
2. ✅ Start development server (`npm run dev`)
3. ✅ Test device registration
4. ✅ Deploy to production

---

**Setup by:** GitHub Copilot  
**Last Updated:** 2024
