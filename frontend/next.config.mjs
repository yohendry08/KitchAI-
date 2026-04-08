import path from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const apiBasePath = process.env.NEXT_PUBLIC_API_URL || "/api"
const backendInternalUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:4000"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    if (!apiBasePath.startsWith("/")) {
      return []
    }

    return [
      {
        source: `${apiBasePath}/:path*`,
        destination: `${backendInternalUrl}/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
