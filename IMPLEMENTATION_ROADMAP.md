# Implementation Roadmap - Remaining Features

## ✅ Completed Features (Deployed)

1. **Professional Email Templates with Logo** ✅
   - Modern HTML email design
   - Indian flag colors branding
   - Security context (IP, browser, location)
   - Mobile-responsive layout

2. **Profile Picture Delete Functionality** ✅
   - OTP-verified deletion
   - Clean removal from Firebase
   - Success/error handling

3. **Security Enhancements** ✅
   - IP address detection
   - Browser/device identification
   - Location tracking
   - Timestamp logging

## 🔄 Partially Implemented

### Backup Email System (Started)
**Created:**
- `src/app/api/auth/send-backup-otp/route.ts` - API endpoint for backup email OTP

**Still Needed:**
- Add `backupEmail` and `backupEmailVerified` fields to user profile
- UI in profile page to add/verify backup email
- OTP verification flow for backup email
- Update Firestore security rules for backup email field

**Implementation Guide:**
```typescript
// Add to profile page state:
const [backupEmail, setBackupEmail] = useState('');
const [backupEmailOtp, setBackupEmailOtp] = useState('');
const [verifyingBackup, setVerifyingBackup] = useState(false);

// Add backup email verification function:
const handleAddBackupEmail = async () => {
  // Send OTP to backup email
  await fetch('/api/auth/send-backup-otp', {
    method: 'POST',
    body: JSON.stringify({ email: backupEmail, type: 'backup-email' })
  });
};

// Add to profile UI:
<TextField 
  label="Backup Email"
  value={profile.backupEmail || ''}
  disabled={!isEditing}
/>
```

## 📋 Not Yet Implemented

### 1. Google TOTP/2FA Authentication System

**Required Steps:**

#### A. Install Dependencies
```bash
npm install otplib qrcode
npm install -D @types/qrcode
```

#### B. Create TOTP Utility
File: `src/utils/totp.ts`
```typescript
import * as OTPAuth from 'otplib/otplib-browser';
import QRCode from 'qrcode';

export async function generateTOTPSecret(email: string) {
  const secret = OTPAuth.authenticator.generateSecret();
  const otpauth = OTPAuth.authenticator.keyuri(
    email,
    'IndianToolsHub',
    secret
  );
  const qrCode = await QRCode.toDataURL(otpauth);
  return { secret, qrCode };
}

export function verifyTOTP(token: string, secret: string): boolean {
  return OTPAuth.authenticator.verify({ token, secret });
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => 
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
}
```

#### C. API Routes Needed
1. `/api/auth/2fa/setup` - Generate QR code and secret
2. `/api/auth/2fa/verify` - Verify TOTP token
3. `/api/auth/2fa/disable` - Disable 2FA

#### D. Database Schema Updates
```typescript
// Add to user profile:
interface UserProfile {
  // ... existing fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  backupCodesUsed?: string[];
}
```

#### E. UI Components Needed
- 2FA setup modal with QR code
- TOTP input field on login
- Backup codes display
- 2FA management in profile page

**Estimated Implementation Time:** 2-3 hours

---

### 2. Dynamic SEO Metadata

**Required Steps:**

#### A. Create SEO Utility
File: `src/utils/seo.ts`
```typescript
export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function generateSEO(page: string, data?: Partial<SEOData>): SEOData {
  const baseUrl = 'https://indian-tools-hub.vercel.app';
  
  const defaults: Record<string, SEOData> = {
    home: {
      title: 'IndianToolsHub - Free Online Tools for India',
      description: 'Access 105+ free online tools...',
      canonical: baseUrl,
    },
    tools: {
      title: 'Online Tools - IndianToolsHub',
      description: 'Browse our collection of free tools...',
      canonical: `${baseUrl}/tools`,
    },
    // ... more pages
  };
  
  return { ...defaults[page], ...data };
}
```

#### B. Create Metadata Component
File: `src/components/SEOHead.tsx`
```typescript
import Head from 'next/head';

export function SEOHead({ seo }: { seo: SEOData }) {
  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}
      {seo.canonical && <link rel="canonical" href={seo.canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Head>
  );
}
```

#### C. Update Pages
Add to each page:
```typescript
import { generateSEO } from '@/utils/seo';
import { SEOHead } from '@/components/SEOHead';

export default function Page() {
  const seo = generateSEO('home');
  return (
    <>
      <SEOHead seo={seo} />
      {/* page content */}
    </>
  );
}
```

**Estimated Implementation Time:** 1 hour

---

## 📊 Implementation Priority

**Recommended Order:**
1. ✅ Email templates & security (DONE)
2. ✅ Profile picture delete (DONE)
3. 🔄 Backup email (50% complete)
4. ⏳ Dynamic SEO (high ROI, quick to implement)
5. ⏳ 2FA/TOTP (complex, takes longest)

## 🚀 Quick Deployment Commands

```bash
# Commit current work
git add .
git commit -m "Add backup email API endpoint"
git push origin main

# Deploy to Vercel (auto-deploys if CI/CD connected)
vercel --prod
```

## 📝 Notes

- All authentication flows use OTP verification
- Security context is logged for all actions
- Firebase Firestore rules need updating for new fields
- Consider rate limiting for OTP endpoints
- Add email verification cooldown (prevent spam)

---

**Last Updated:** 2026-06-08
**Status:** Email & Security features deployed, Backup email API created
**Next:** Complete backup email UI + 2FA + SEO
