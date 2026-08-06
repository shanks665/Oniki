import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // GA4 (gtag) loads from googletagmanager; Stripe + Firebase also need script access
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.firebaseio.com https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline'",
            // New Firebase buckets use *.firebasestorage.app (not only firebasestorage.googleapis.com)
            "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.firebasestorage.app https://maps.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",
            "font-src 'self'",
            "connect-src 'self' https://*.googleapis.com https://firebasestorage.googleapis.com https://*.firebasestorage.app https://*.firebaseio.com wss://*.firebaseio.com https://api.stripe.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
            "frame-src https://js.stripe.com https://www.google.com https://maps.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
