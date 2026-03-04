import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project to avoid Next.js picking up
    // a parent-level lockfile when multiple projects exist in the same tree.
    root: path.resolve(__dirname),
  },
}

export default nextConfig
