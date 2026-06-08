import type { NextConfig } from "next";
import { execSync } from 'child_process';

const getGitInfo = () => {
  try {
    const commitHash = execSync('git log -1 --format="%h"', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    const timeAgo = execSync('git log -1 --format="%cr"', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    let branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    if (branch === 'main') branch = 'Main';
    if (branch === 'master') branch = 'Master';
    return { commitHash, timeAgo, branch };
  } catch (e) {
    // Return default values when git is not available (e.g., in Vercel build environment)
    return { commitHash: 'unknown', timeAgo: 'unknown', branch: 'unknown' };
  }
};

const gitInfo = getGitInfo();

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_VERSION: gitInfo.commitHash,
    NEXT_PUBLIC_BUILD_TIME_AGO: gitInfo.timeAgo,
    NEXT_PUBLIC_BUILD_BRANCH: gitInfo.branch,
  },
};

export default nextConfig;
