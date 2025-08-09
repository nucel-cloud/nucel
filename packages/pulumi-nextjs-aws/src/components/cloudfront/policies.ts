import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions } from "../../types/index.js";

/**
 * Gets or creates CloudFront cache policies for OpenNext v3 deployments.
 * By default, uses shared policies to avoid AWS limits. Can create per-deployment
 * policies if useSharedPolicies is false.
 */
export function createCachePolicies(name: string, opts?: ComponentOptions & { useSharedPolicies?: boolean }) {
  const useShared = opts?.useSharedPolicies !== false; // Default to true
  
  if (!useShared) {
    // Create per-deployment policies (legacy behavior)
    return createPerDeploymentCachePolicies(name, opts);
  }
  // Try to get existing shared cache policies first, create if they don't exist
  // Using fixed names with v3 suffix to ensure they're shared across all deployments
  
  // Server cache policy - shared across all OpenNext v3 deployments
  const serverCachePolicyName = "opennext-v3-server-cache";
  const serverCachePolicy = pulumi.output(
    aws.cloudfront.getCachePolicy({ name: serverCachePolicyName }, { async: true }).catch(() => null)
  ).apply(existingPolicy => {
    if (existingPolicy?.id) {
      return existingPolicy;
    }
    // Create only if it doesn't exist
    return new aws.cloudfront.CachePolicy(serverCachePolicyName, {
      name: serverCachePolicyName,
      comment: "Shared OpenNext v3 server cache policy - optimized for SSR and API routes",
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
    }, { ...opts, protect: true }); // Protect from accidental deletion
  });

  // Static assets cache policy - shared across all OpenNext v3 deployments
  const staticAssetsPolicyName = "opennext-v3-static-assets";
  const staticAssetsOptimizedCache = pulumi.output(
    aws.cloudfront.getCachePolicy({ name: staticAssetsPolicyName }, { async: true }).catch(() => null)
  ).apply(existingPolicy => {
    if (existingPolicy?.id) {
      return existingPolicy;
    }
    // Create only if it doesn't exist
    return new aws.cloudfront.CachePolicy(staticAssetsPolicyName, {
      name: staticAssetsPolicyName,
      comment: "Shared OpenNext v3 static assets cache policy - long TTL for immutable assets",
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
    }, { ...opts, protect: true }); // Protect from accidental deletion
  });

  // Use AWS managed policies where possible
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

/**
 * Gets or creates a shared response headers policy for OpenNext v3 deployments.
 * This policy adds security headers to all responses.
 */
export function createResponseHeadersPolicy(_name: string, opts?: ComponentOptions) {
  const policyName = "opennext-v3-response-headers";
  
  return pulumi.output(
    aws.cloudfront.getResponseHeadersPolicy({ name: policyName }, { async: true }).catch(() => null)
  ).apply(existingPolicy => {
    if (existingPolicy?.id) {
      return existingPolicy;
    }
    // Create only if it doesn't exist
    return new aws.cloudfront.ResponseHeadersPolicy(policyName, {
      name: policyName,
      comment: "Shared OpenNext v3 security headers policy",
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
    }, { ...opts, protect: true }); // Protect from accidental deletion
  });
}

/**
 * Gets or creates a shared CloudFront viewer request function for OpenNext v3.
 * This function handles cache key generation and header forwarding.
 */
export function createViewerRequestFunction(_name: string, opts?: ComponentOptions) {
  const functionName = "opennext-v3-viewer-request";
  
  return pulumi.output(
    aws.cloudfront.getFunction({ name: functionName, stage: "LIVE" }, { async: true }).catch(() => null)
  ).apply(existingFunction => {
    if (existingFunction?.arn) {
      return existingFunction;
    }
    // Create only if it doesn't exist
    return new aws.cloudfront.Function(functionName, {
      name: functionName,
      comment: "Shared OpenNext v3 viewer request handler",
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
    }, { ...opts, protect: true }); // Protect from accidental deletion
  });
}

/**
 * Creates per-deployment cache policies (legacy behavior).
 * Use only if you need custom policies per deployment.
 */
function createPerDeploymentCachePolicies(name: string, opts?: ComponentOptions) {
  const serverCachePolicy = new aws.cloudfront.CachePolicy(`${name}-server-cache`, {
    comment: `OpenNext v3 server cache policy for ${name}`,
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
    comment: `OpenNext v3 static assets cache policy for ${name}`,
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