'use client';

import React from 'react';
import { Box, Chip, Tooltip, Stack } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CodeIcon from '@mui/icons-material/Code';

interface BuildInfoProps {
  variant?: 'full' | 'compact';
}

export default function BuildInfo({ variant = 'full' }: BuildInfoProps) {
  const commitHash = process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown';
  const timeAgo = process.env.NEXT_PUBLIC_BUILD_TIME_AGO || 'unknown';
  const branch = process.env.NEXT_PUBLIC_BUILD_BRANCH || 'unknown';
  
  // GitHub repository URL
  const repoUrl = 'https://github.com/zestcommerce841428-png/IndianToolsHub';
  const commitUrl = commitHash !== 'unknown' ? `${repoUrl}/commit/${commitHash}` : repoUrl;

  if (variant === 'compact') {
    return (
      <Tooltip title={`Branch: ${branch} • Updated ${timeAgo}`} arrow>
        <Chip
          icon={<GitHubIcon sx={{ fontSize: '0.9rem' }} />}
          label={`Build ${commitHash}`}
          size="small"
          component="a"
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          sx={{
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            borderColor: '#38bdf8',
            border: '1px solid',
            '&:hover': {
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              borderColor: '#0ea5e9',
            },
            '& .MuiChip-icon': {
              color: '#38bdf8',
            },
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{
        textAlign: { xs: 'center', sm: 'right' },
        alignItems: { xs: 'center', sm: 'flex-start' },
      }}
    >
      {/* Commit Hash Chip */}
      <Tooltip title="View commit on GitHub" arrow>
        <Chip
          icon={<GitHubIcon sx={{ fontSize: '0.9rem' }} />}
          label={`${commitHash}`}
          size="small"
          component="a"
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          sx={{
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            borderColor: '#38bdf8',
            border: '1px solid',
            fontWeight: 600,
            fontSize: '0.75rem',
            '&:hover': {
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              borderColor: '#0ea5e9',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s',
            '& .MuiChip-icon': {
              color: '#38bdf8',
            },
          }}
        />
      </Tooltip>

      {/* Time Ago Chip */}
      <Tooltip title="Last deployment time" arrow>
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: '0.9rem' }} />}
          label={timeAgo}
          size="small"
          sx={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#a78bfa',
            borderColor: '#a78bfa',
            border: '1px solid',
            fontWeight: 600,
            fontSize: '0.75rem',
            '&:hover': {
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
            },
            transition: 'all 0.2s',
            '& .MuiChip-icon': {
              color: '#a78bfa',
            },
          }}
        />
      </Tooltip>

      {/* Branch Chip */}
      <Tooltip title="Git branch" arrow>
        <Chip
          icon={<CodeIcon sx={{ fontSize: '0.9rem' }} />}
          label={branch}
          size="small"
          sx={{
            backgroundColor: branch === 'Main' || branch === 'Master' 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(251, 146, 60, 0.1)',
            color: branch === 'Main' || branch === 'Master' 
              ? '#4ade80' 
              : '#fb923c',
            borderColor: branch === 'Main' || branch === 'Master' 
              ? '#4ade80' 
              : '#fb923c',
            border: '1px solid',
            fontWeight: 600,
            fontSize: '0.75rem',
            '&:hover': {
              backgroundColor: branch === 'Main' || branch === 'Master' 
                ? 'rgba(34, 197, 94, 0.2)' 
                : 'rgba(251, 146, 60, 0.2)',
            },
            transition: 'all 0.2s',
            '& .MuiChip-icon': {
              color: branch === 'Main' || branch === 'Master' 
                ? '#4ade80' 
                : '#fb923c',
            },
          }}
        />
      </Tooltip>
    </Stack>
  );
}
