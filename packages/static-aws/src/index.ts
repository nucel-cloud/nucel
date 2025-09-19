export { StaticSite } from "./static.js";
export type {
  StaticSiteArgs,
  DomainConfig,
  CloudFrontLoggingConfig,
  CustomErrorResponse,
  CacheBehavior,
} from "./types/index.js";

// Export components for advanced use cases
export * from "./components/s3.js";
export * from "./components/cloudfront.js";
export * from "./components/acm.js";
export * from "./components/route53.js";