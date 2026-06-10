'use client';

import React from 'react';
import { Typography } from '@mui/material';

interface BuildInfoProps {
  variant?: 'full' | 'compact';
}

export default function BuildInfo({ variant = 'full' }: BuildInfoProps) {
  const commitHash = process.env.NEXT_PUBLIC_BUILD_VERSION || '';
  const timeAgo = process.env.NEXT_PUBLIC_BUILD_TIME_AGO || '';
  const branch = process.env.NEXT_PUBLIC_BUILD_BRANCH || '';
  
  // Don't render if no data
  if (!commitHash && !timeAgo && !branch) {
    return null;
  }
  
  const displayText = [commitHash, timeAgo, branch].filter(Boolean).join(' - ');
  
  return (
    <Typography variant="body2" sx={{ color: '#64748b', textAlign: { xs: 'center', sm: 'right' } }}>
      Build: {displayText}
    </Typography>
  );
}
