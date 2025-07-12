import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions } from "../../types/index.js";

export function createCachePolicies(name: string, opts?: ComponentOptions) {
  const serverCachePolicy = new aws.cloudfront.CachePolicy(`${name}-server-cache`, {
    comment: "OpenNext server cache policy - optimized",
    defaultTtl: 300,
    maxTtl: 31536000,
    minTtl: 1,
    parametersInCacheKeyAndForwardedToOrigin: {
      cookiesConfig: {
        cookieBehavior: "all",
      },
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      headersConfig: {
        headerBehavior: "whitelist",
        headers: {
          items: ["x-open-next-cache-key"],
        },
      },
      queryStringsConfig: {
        queryStringBehavior: "all",
      },
    },
  }, opts);

  const staticAssetsOptimizedCache = new aws.cloudfront.CachePolicy(`${name}-static-assets-cache`, {
    comment: "Optimized cache policy for static assets with long TTL",
    defaultTtl: 86400 * 30,
    maxTtl: 31536000,
    minTtl: 86400,
    parametersInCacheKeyAndForwardedToOrigin: {
      cookiesConfig: {
        cookieBehavior: "none",
      },
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      headersConfig: {
        headerBehavior: "whitelist",
        headers: {
          items: ["CloudFront-Viewer-Country", "CloudFront-Is-Mobile-Viewer"],
        },
      },
      queryStringsConfig: {
        queryStringBehavior: "all",
      },
    },
  }, opts);

  const staticCachePolicy = pulumi.output(
    aws.cloudfront.getCachePolicy({ name: "Managed-CachingOptimized" })
  ).apply(policy => policy.id!);

  const serverOriginRequestPolicy = pulumi.output(
    aws.cloudfront.getOriginRequestPolicy({ name: "Managed-AllViewerExceptHostHeader" })
  ).apply(policy => policy.id!);

  return {
    serverCachePolicy,
    staticAssetsOptimizedCache,
    staticCachePolicy,
    serverOriginRequestPolicy,
  };
}

export function createResponseHeadersPolicy(name: string, opts?: ComponentOptions) {
  return new aws.cloudfront.ResponseHeadersPolicy(`${name}-response-headers`, {
    comment: "OpenNext security headers",
    securityHeadersConfig: {
      contentTypeOptions: {
        override: false,
      },
      frameOptions: {
        frameOption: "DENY",
        override: true,
      },
      referrerPolicy: {
        referrerPolicy: "same-origin",
        override: true,
      },
      strictTransportSecurity: {
        accessControlMaxAgeSec: 63072000,
        includeSubdomains: true,
        override: true,
      },
      xssProtection: {
        modeBlock: true,
        protection: true,
        override: true,
      },
    },
  }, opts);
}

export function createViewerRequestFunction(name: string, opts?: ComponentOptions) {
  return new aws.cloudfront.Function(`${name}-viewer-request`, {
    runtime: "cloudfront-js-2.0",
    code: `
function handler(event) {
    var request = event.request;
    
    // Forward host header
    request.headers["x-forwarded-host"] = request.headers.host;
    
    // Helper function to get header values
    function getHeader(key) {
        var header = request.headers[key];
        if (header) {
            if (header.multiValue) {
                return header.multiValue.map(function(h) { return h.value; }).join(",");
            }
            if (header.value) {
                return header.value;
            }
        }
        return "";
    }
    
    // Generate cache key for OpenNext v3
    var cacheKey = "";
    if (request.uri.includes("/_next/image")) {
        cacheKey = getHeader("accept");
    } else {
        cacheKey = getHeader("rsc") +
            getHeader("next-router-prefetch") +
            getHeader("next-router-state-tree") +
            getHeader("next-url") +
            getHeader("x-prerender-revalidate");
    }
    
    // Include prerender bypass cookie if present
    if (request.cookies["__prerender_bypass"]) {
        cacheKey += request.cookies["__prerender_bypass"] 
            ? request.cookies["__prerender_bypass"].value 
            : "";
    }
    
    // Hash the cache key
    var crypto = require("crypto");
    var hashedKey = crypto.createHash("md5").update(cacheKey).digest("hex");
    request.headers["x-open-next-cache-key"] = { value: hashedKey };
    
    // Forward CloudFront geo headers
    if (request.headers["cloudfront-viewer-city"]) {
        request.headers["x-open-next-city"] = request.headers["cloudfront-viewer-city"];
    }
    if (request.headers["cloudfront-viewer-country"]) {
        request.headers["x-open-next-country"] = request.headers["cloudfront-viewer-country"];
    }
    if (request.headers["cloudfront-viewer-region"]) {
        request.headers["x-open-next-region"] = request.headers["cloudfront-viewer-region"];
    }
    if (request.headers["cloudfront-viewer-latitude"]) {
        request.headers["x-open-next-latitude"] = request.headers["cloudfront-viewer-latitude"];
    }
    if (request.headers["cloudfront-viewer-longitude"]) {
        request.headers["x-open-next-longitude"] = request.headers["cloudfront-viewer-longitude"];
    }
    
    return request;
}
    `,
    publish: true,
  }, opts);
}