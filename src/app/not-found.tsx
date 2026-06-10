'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Container, Box, Typography, Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function NotFoundContent() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            mb: 2,
          }}
        >
          Page Not Found
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: 'text.secondary',
            mb: 4,
            maxWidth: '600px',
          }}
        >
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or never existed.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/"
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            sx={{ minWidth: 150 }}
          >
            Go Home
          </Button>
          
          <Button
            component={Link}
            href="/#search"
            variant="outlined"
            size="large"
            startIcon={<SearchIcon />}
            sx={{ minWidth: 150 }}
          >
            Search Tools
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Typography variant="h4">Loading...</Typography>
        </Box>
      </Container>
    }>
      <NotFoundContent />
    </Suspense>
  );
}
