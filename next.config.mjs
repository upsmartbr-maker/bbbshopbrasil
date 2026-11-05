/** @type {import('next').NextConfig} */
let customSupabaseHost;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    customSupabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {
  customSupabaseHost = undefined;
}

const remotePatterns = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
  {
    protocol: "https",
    hostname: "**.supabase.in",
    pathname: "/storage/v1/object/public/**",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.mlstatic.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.mercadopago.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.pagseguro.com",
    pathname: "/**",
  },
];

if (
  customSupabaseHost &&
  !customSupabaseHost.endsWith(".supabase.co") &&
  !customSupabaseHost.endsWith(".supabase.in")
) {
  remotePatterns.push({
    protocol: "https",
    hostname: customSupabaseHost,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns,
  },
};

export default nextConfig;
