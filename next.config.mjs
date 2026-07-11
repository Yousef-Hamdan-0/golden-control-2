/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  // PDF generation: keep the browser packages external so the serverless
  // bundle resolves @sparticuz/chromium's binary and puppeteer at runtime.
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    // The PDF routes read the bundled fonts/logo from public/ at runtime.
    "/api/requests/[id]/pdf": ["./public/fonts/**", "./public/brand/**"],
    "/api/invoices/[id]/pdf": ["./public/fonts/**", "./public/brand/**"],
    "/api/reports/[type]": ["./public/fonts/**", "./public/brand/**"],
  },
};

export default nextConfig;
