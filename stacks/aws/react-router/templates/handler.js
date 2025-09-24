import { createRequestHandler } from 'react-router';
import { writeReadableStreamToWritable } from '@react-router/node';
import * as build from './index.js';

console.log('Handler initialized - checking imports:', {
  hasCreateRequestHandler: typeof createRequestHandler,
  hasWriteReadableStreamToWritable: typeof writeReadableStreamToWritable,
  buildKeys: Object.keys(build || {}),
  buildType: typeof build,
  hasRoutes: !!build?.routes,
  hasEntry: !!build?.entry,
  hasAssets: !!build?.assets
});

/**
 * AWS Lambda handler for React Router v7 application
 * Handles both streaming and buffered responses
 * Compatible with Lambda Function URLs
 */

// Create the React Router request handler
console.log('Creating request handler with build:', {
  buildStructure: Object.keys(build || {}),
  mode: process.env.NODE_ENV || 'production'
});

const handleRequest = createRequestHandler(
  build,
  process.env.NODE_ENV || 'production'
);

console.log('Request handler created:', {
  handlerType: typeof handleRequest,
  isFunction: typeof handleRequest === 'function'
});

// Helper to create an empty stream (needed for Function URLs)
const emptyStream = () =>
  new ReadableStream({
    start(controller) {
      controller.enqueue("");
      controller.close();
    },
  });

// Helper to create Request from Lambda event
function createRequest(event) {
  const { rawPath, headers, queryStringParameters, body, isBase64Encoded, requestContext } = event;

  // Log incoming cookies for debugging
  console.log('Incoming request cookies:', {
    cookie: headers?.cookie || headers?.Cookie || 'NO COOKIES',
    allHeaders: Object.keys(headers || {}),
  });

  // Use x-forwarded-host for custom domain support
  const host = headers?.['x-forwarded-host'] || headers?.host || 'localhost';
  const scheme = headers?.['x-forwarded-proto'] || 'https';

  // Build the URL
  const rawQueryString = queryStringParameters
    ? new URLSearchParams(queryStringParameters).toString()
    : '';
  const search = rawQueryString ? `?${rawQueryString}` : '';
  const url = new URL(`${scheme}://${host}${rawPath || '/'}${search}`);

  // Decode body if base64 encoded
  let requestBody = body;
  if (body && isBase64Encoded) {
    requestBody = Buffer.from(body, 'base64').toString();
  }

  // Create the Request
  return new Request(url.href, {
    method: requestContext?.http?.method || 'GET',
    headers: new Headers(headers || {}),
    body: requestBody || undefined,
  });
}

// Extract response metadata for Lambda
function extractResponseMetadata(response) {
  const headers = {};
  const cookies = [];

  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(value);
    } else {
      headers[key] = value;
    }
  }

  const metadata = {
    statusCode: response.status,
    headers
  };

  if (cookies.length > 0) {
    metadata.cookies = cookies;
  }

  return metadata;
}

// Streaming handler using awslambda.streamifyResponse
export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  console.log('Processing streaming request:', {
    path: event.rawPath,
    method: event.requestContext?.http?.method,
  });

  try {
    console.log('Creating request from event...');
    const request = createRequest(event);

    console.log('Request created:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });

    console.log('Calling handleRequest...');
    const response = await handleRequest(request);

    console.log('React Router response received:', {
      responseType: typeof response,
      isResponse: response instanceof Response,
      status: response?.status,
      statusText: response?.statusText,
      headers: response?.headers ? Object.fromEntries(response.headers.entries()) : 'no headers',
      hasBody: !!response?.body,
      bodyType: response?.body ? typeof response.body : 'no body',
      location: response?.headers?.get('location') || 'NO LOCATION',
      setCookie: response?.headers?.get('set-cookie') || 'NO SET-COOKIE',
      contentType: response?.headers?.get('content-type') || 'NO CONTENT-TYPE'
    });

    // Extract metadata from the response
    const metadata = extractResponseMetadata(response);

    console.log('Extracted metadata:', metadata);

    // For Lambda Function URLs, use HttpResponseStream
    const httpResponseStream = awslambda.HttpResponseStream.from(
      responseStream,
      metadata
    );

    // Get the response body
    let body = response.body;
    if (!body) {
      console.log('No body in response, writing empty string');
      // Write empty string to ensure stream is properly closed
      httpResponseStream.write("");
      httpResponseStream.end();
    } else {
      console.log('Body found:', {
        bodyType: typeof body,
        isReadableStream: body instanceof ReadableStream,
        bodyConstructor: body.constructor.name
      });

      // Use React Router's utility to write the stream
      await writeReadableStreamToWritable(body, httpResponseStream);
    }

    console.log('Response streaming completed successfully');

  } catch (error) {
    console.error('Streaming handler error - full details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      errorType: typeof error,
      errorKeys: Object.keys(error || {})
    });

    // Error response using HttpResponseStream
    const errorResponse = awslambda.HttpResponseStream.from(
      responseStream,
      {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    errorResponse.write(JSON.stringify({
      message: 'Internal server error',
      error: error.message,
      details: error.stack
    }));
    errorResponse.end();
  }
});

// Also export a buffered handler for compatibility
export async function bufferedHandler(event, context) {
  console.log('Processing buffered request:', {
    path: event.rawPath,
    method: event.requestContext?.http?.method,
  });

  try {
    const request = createRequest(event);
    const response = await handleRequest(request);

    // Extract headers
    const responseHeaders = {};
    const cookies = [];

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        cookies.push(value);
      } else {
        responseHeaders[key] = value;
      }
    }

    // Get body as text
    let body = '';
    if (response.body) {
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks and decode
      const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      body = new TextDecoder().decode(combined);
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      cookies,
      body,
      isBase64Encoded: false
    };
  } catch (error) {
    console.error('Buffered handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
}