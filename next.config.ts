import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Security headers. Defaults below assume the app runs on its own origin
// and that the in-sheet sidebar surface (rendered inside an Apps Script
// iframe on *.googleusercontent.com) is the only legitimate cross-origin
// embedder. If you change that, update frame-ancestors and the COOP/COEP
// posture accordingly. CSP is intentionally not enabled here because the
// app currently renders user-authored MDX with arbitrary JSX expressions,
// which needs a nonce strategy to be CSP-safe — see follow-up plan.
const securityHeaders: Array<{ key: string; value: string }> = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const sidebarHeaders: Array<{ key: string; value: string }> = [
  // The sidebar route is intentionally embeddable from the Apps Script
  // sandbox. Everywhere else, default to same-origin only.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self' https://*.googleusercontent.com",
  },
];

const defaultFrameAncestors: Array<{ key: string; value: string }> = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  async headers() {
    return [
      {
        source: "/:locale/sidebar/:path*",
        headers: [...securityHeaders, ...sidebarHeaders],
      },
      {
        source: "/:locale/test-sidebar/:path*",
        headers: [...securityHeaders, ...sidebarHeaders],
      },
      {
        source: "/:path*",
        headers: [...securityHeaders, ...defaultFrameAncestors],
      },
    ];
  },
};

const withMDX = createMDX({});
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

export default withNextIntl(withMDX(nextConfig));
