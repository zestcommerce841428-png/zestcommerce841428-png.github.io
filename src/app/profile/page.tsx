'use client';

import React, { useState, useRef } from 'react';
import {
  Container, Box, Typography, Paper, Button, Avatar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert, TextField, MenuItem
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useRouter } from 'next/navigation';

import { auth, db } from '@/config/firebase';
import { updateProfile, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

function ProfileDashboard() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // --- OTP Flow State ---
  const [otpAction, setOtpAction] = useState<'save' | 'delete' | 'avatar' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const triggerOtp = async (action: 'save' | 'delete' | 'avatar', file?: File) => {
    if (!user || !user.email) return;
    setError('');
    setSuccess('');
    
    if (action === 'avatar' && file) {
      setPendingAvatarFile(file);
    }

    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, subject: 'Verify Profile Changes' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOtpAction(action);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !user.email) return;
    setOtpLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, otp: otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Success, perform the action
      if (otpAction === 'save') {
        await executeSaveProfile();
      } else if (otpAction === 'delete') {
        await executeDeleteAccount();
      } else if (otpAction === 'avatar' && pendingAvatarFile) {
        await executeAvatarUpload(pendingAvatarFile);
      }
      
      setOtpAction(null);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Actions ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File size should be less than 2MB.");
      return;
    }
    triggerOtp('avatar', file);
  };

  const executeAvatarUpload = async (file: File) => {
    if (!user) return;
    const apiUrl = process.env.NEXT_PUBLIC_HOSTINGER_API_URL;
    const apiSecret = process.env.NEXT_PUBLIC_UPLOAD_SECRET;
    if (!apiUrl || !apiSecret) {
      setError("Hostinger API configuration is missing.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('uid', user.uid);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiSecret}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const downloadURL = data.url;
      await updateProfile(user, { photoURL: downloadURL });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
      setSuccess("Profile picture updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload picture.");
    } finally {
      setUploading(false);
      setPendingAvatarFile(null);
    }
  };

  const executeDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError("Firebase Security: Please log out and log back in to delete your account.");
      } else {
        setError(err.message || "Failed to delete account.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && profile) {
      setEditData({
        fullName: profile.fullName || '', phone: profile.phone || '',
        age: profile.age || '', gender: profile.gender || '',
        bio: profile.bio || '', company: profile.company || '',
        jobTitle: profile.jobTitle || '', expertiseArea: profile.expertiseArea || '',
        address: profile.address || '', city: profile.city || '',
        country: profile.country || '', postalCode: profile.postalCode || '',
        githubUrl: profile.githubUrl || '', linkedinUrl: profile.linkedinUrl || '',
        twitterUrl: profile.twitterUrl || '',
      });
    }
    setIsEditing(!isEditing);
    setError(''); setSuccess('');
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const executeSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), editData);
      if (editData.fullName !== profile?.fullName) {
        await updateProfile(user, { displayName: editData.fullName });
      }
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) return null; 

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="md" sx={{ py: 6, flexGrow: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, fontFamily: '"Poppins", sans-serif' }}>
          My Profile Dashboard
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, mb: 4, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={profile.photoURL || undefined} sx={{ width: 120, height: 120, fontSize: '3rem', border: '4px solid #fff' }}>
              {!profile.photoURL && profile.fullName.charAt(0)}
            </Avatar>
            {uploading && <CircularProgress size={128} sx={{ position: 'absolute', top: -4, left: -4, zIndex: 1 }} />}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{profile.fullName}</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>{profile.email}</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileSelect} />
              <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => fileInputRef.current?.click()} disabled={uploading || otpLoading}>
                Upload New Avatar
              </Button>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '2px solid', borderColor: 'divider', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal & Professional Details</Typography>
            {!isEditing ? (
              <Button startIcon={<EditIcon />} variant="outlined" onClick={handleEditToggle}>Edit Profile</Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<CancelIcon />} variant="text" color="inherit" onClick={handleEditToggle} disabled={saving || otpLoading}>Cancel</Button>
                <Button startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />} variant="contained" color="success" onClick={() => triggerOtp('save')} disabled={saving || otpLoading}>
                  Save Changes
                </Button>
              </Box>
            )}
          </Box>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2, textTransform: 'uppercase' }}>Basic Information</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Full Name</Typography>
              {isEditing ? <TextField fullWidth size="small" name="fullName" value={editData.fullName} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.fullName}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Phone Number</Typography>
              {isEditing ? <TextField fullWidth size="small" name="phone" value={editData.phone} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.phone || 'Not provided'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Age</Typography>
              {isEditing ? <TextField fullWidth size="small" name="age" type="number" value={editData.age} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.age || 'N/A'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Gender</Typography>
              {isEditing ? (
                <TextField select fullWidth size="small" name="gender" value={editData.gender} onChange={handleEditChange}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </TextField>
              ) : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.gender || 'N/A'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">Bio</Typography>
              {isEditing ? <TextField fullWidth multiline rows={3} name="bio" value={editData.bio} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.bio || 'Not provided'}</Typography>}
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2, textTransform: 'uppercase' }}>Professional Information</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Company</Typography>
              {isEditing ? <TextField fullWidth size="small" name="company" value={editData.company} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.company || 'Not provided'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Job Title</Typography>
              {isEditing ? <TextField fullWidth size="small" name="jobTitle" value={editData.jobTitle} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.jobTitle || 'Not provided'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Expertise Area</Typography>
              {isEditing ? <TextField fullWidth size="small" name="expertiseArea" value={editData.expertiseArea} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.expertiseArea || 'Not provided'}</Typography>}
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2, textTransform: 'uppercase' }}>Location</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Address</Typography>
              {isEditing ? <TextField fullWidth size="small" name="address" value={editData.address} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.address || 'Not provided'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">City</Typography>
              {isEditing ? <TextField fullWidth size="small" name="city" value={editData.city} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.city || 'N/A'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Country</Typography>
              {isEditing ? <TextField fullWidth size="small" name="country" value={editData.country} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.country || 'N/A'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Postal Code</Typography>
              {isEditing ? <TextField fullWidth size="small" name="postalCode" value={editData.postalCode} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500 }}>{profile.postalCode || 'N/A'}</Typography>}
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2, textTransform: 'uppercase' }}>Social Links</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">GitHub</Typography>
              {isEditing ? <TextField fullWidth size="small" name="githubUrl" type="url" value={editData.githubUrl} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" style={{ color: '#FF9933' }}>{profile.githubUrl}</a> : 'Not provided'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">LinkedIn</Typography>
              {isEditing ? <TextField fullWidth size="small" name="linkedinUrl" type="url" value={editData.linkedinUrl} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: '#FF9933' }}>{profile.linkedinUrl}</a> : 'Not provided'}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Twitter</Typography>
              {isEditing ? <TextField fullWidth size="small" name="twitterUrl" type="url" value={editData.twitterUrl} onChange={handleEditChange} /> : <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>{profile.twitterUrl ? <a href={profile.twitterUrl} target="_blank" rel="noreferrer" style={{ color: '#FF9933' }}>{profile.twitterUrl}</a> : 'Not provided'}</Typography>}
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'error.main' }}>
            <WarningIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Danger Zone</Typography>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Once you delete your account, there is no going back. All of your personal data will be wiped.
          </Typography>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => triggerOtp('delete')} disabled={deleting || otpLoading}>
            Delete Account Permanently
          </Button>
        </Paper>

      </Container>
      <Footer />

      {/* Shared OTP Modal */}
      <Dialog open={!!otpAction} onClose={() => !otpLoading && setOtpAction(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Security Verification</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To authorize this action, please enter the 6-digit OTP we just sent to <strong>{user.email}</strong>.
          </DialogContentText>
          <TextField autoFocus fullWidth label="6-Digit OTP" variant="outlined" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} disabled={otpLoading} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOtpAction(null)} disabled={otpLoading} color="inherit">Cancel</Button>
          <Button onClick={handleVerifyOtp} variant="contained" disabled={otpLoading || otpCode.length < 5}>
            {otpLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <ProfileDashboard />
    </ProtectedRoute>
  );
}
