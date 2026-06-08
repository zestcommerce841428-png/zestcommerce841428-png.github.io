'use client';

import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, CircularProgress, Alert, Divider, Tabs, Tab } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendSignInLinkToEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const handleGoogleSignIn = async () => {
    setError('');
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setError("Firebase configuration is missing.");
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || '',
          photoURL: user.photoURL || null,
          role: 'user',
          createdAt: new Date().toISOString(),
          phone: '', age: '', gender: '', bio: '', company: '', jobTitle: '',
          expertiseArea: '', address: '', city: '', country: '', postalCode: '',
          githubUrl: '', linkedinUrl: '', twitterUrl: ''
        });
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setError("Firebase configuration is missing. Cannot log in.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const actionCodeSettings = {
      // Must exactly match your domain + the finish-signup route
      url: typeof window !== 'undefined' ? `${window.location.origin}/auth/finish-signup` : 'http://localhost:3000/auth/finish-signup',
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSuccess("Magic link sent! Check your email and click the link to sign in instantly.");
    } catch (err: any) {
      setError(err.message || "Failed to send magic link. Make sure Email Link is enabled in your Firebase Console.");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="sm" sx={{ py: 8, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, width: '100%', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1, fontFamily: '"Poppins", sans-serif', textAlign: 'center' }}>
            Welcome Back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Secure login to access all advanced tools.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={<GoogleIcon />}
            sx={{ py: 1.5, mb: 3, fontSize: '1rem', fontWeight: 600, borderRadius: 2, color: 'text.primary', borderColor: 'divider' }}
          >
            Sign in with Google
          </Button>

          <Divider sx={{ mb: 3, '&::before, &::after': { borderColor: 'divider' } }}>
            <Typography variant="body2" color="text.secondary">OR</Typography>
          </Divider>

          <Tabs 
            value={mode} 
            onChange={(_, newValue) => { setMode(newValue); setError(''); setSuccess(''); }} 
            variant="fullWidth" 
            sx={{ mb: 3 }}
          >
            <Tab value="password" label="Password Login" sx={{ fontWeight: 600 }} />
            <Tab value="magic" label="Magic Link (No Password)" sx={{ fontWeight: 600 }} />
          </Tabs>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 3 }}>
                By logging in, you agree to our <Link href="/term-conditions" style={{ color: '#FF9933' }}>Terms of Service</Link> and <Link href="/privacy-policy" style={{ color: '#FF9933' }}>Privacy Policy</Link>.
              </Typography>

              <Box sx={{ mb: 3, textAlign: 'right' }}>
                <Link href="/auth/forgot-password" style={{ color: '#FF9933', textDecoration: 'none', fontSize: '0.875rem' }}>
                  Forgot Password?
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In securely'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSubmit}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Enter your email and we'll send you a secure link to instantly log in without a password.
              </Typography>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={<EmailIcon />}
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600, borderRadius: 2, bgcolor: '#128807', '&:hover': { bgcolor: '#0f7006' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Magic Link'}
              </Button>
            </form>
          )}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link href="/auth/register" style={{ color: '#FF9933', textDecoration: 'none', fontWeight: 600 }}>
                Register here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}
