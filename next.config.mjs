/** @type {import('next').NextConfig} */
let customSupabaseHost;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const cleanUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      .trim()
      .replace(/\/rest\/v1\/?$/i, "");
    customSupabaseHost = new URL(cleanUrl).hostname;
  }
} catch {
  customSupabaseHost = undefined;
}

const remotePatterns = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "xfaxxdmjxwfyfxylzepf.supabase.co",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "xfaxxldmjxwfyfxylzepf.supabase.co",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.supabase.in",
    pathname: "/**",
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
    pathname: "/**",
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
