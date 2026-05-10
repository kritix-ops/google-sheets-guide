import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

const withMDX = createMDX({});
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

export default withNextIntl(withMDX(nextConfig));
