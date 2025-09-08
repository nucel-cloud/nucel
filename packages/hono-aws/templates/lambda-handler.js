/**
 * AWS Lambda handler for Hono applications
 * Converts Lambda events to Fetch API Request and Response
 */

// Helper to determine if content should be base64 encoded
const isBase64Encoded = (contentType) => {
  if (!contentType) return false;
  
  const textTypes = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-www-form-urlencoded',
  ];
  
  return !textTypes.some(type => contentType.includes(type));
};

const createRequest = (event, context) => {
  const headers = new Headers();
  
  
  if (event.headers) {
    Object.entries(event.headers).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
  }
  
  if (event.multiValueHeaders) {
    Object.entries(event.multiValueHeaders).forEach(([key, values]) => {
      if (values) {
        values.forEach(value => headers.append(key, value));
      }
    });
  }
  
  let url;
  const host = headers.get('host') || 'lambda.amazonaws.com';
  const protocol = headers.get('x-forwarded-proto') || 'https';
  
  if (event.rawPath) {
    // API Gateway v2 / Function URL
    url = `${protocol}://${host}${event.rawPath}`;
    if (event.rawQueryString) {
      url += `?${event.rawQueryString}`;
    }
  } else {
    throw new Error('Unable to determine request path');
  }
  
  const method = event.requestContext?.http?.method || 
                 event.requestContext?.httpMethod || 
                 event.httpMethod || 
                 'GET';
  
  let body = undefined;
  if (event.body) {
    if (event.isBase64Encoded) {
      body = Buffer.from(event.body, 'base64');
    } else {
      body = event.body;
    }
  }
  
  const request = new Request(url, {
    method,
    headers,
    body: body && method !== 'GET' && method !== 'HEAD' ? body : undefined,
  });
  
  request.lambdaEvent = event;
  request.lambdaContext = context;
  
  return request;
};

const createResult = async (response, event) => {
  const headers = {};
  const multiValueHeaders = {};
  
  // Process response headers
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      // Handle set-cookie as multi-value header
      if (!multiValueHeaders['set-cookie']) {
        multiValueHeaders['set-cookie'] = [];
      }
      multiValueHeaders['set-cookie'].push(value);
    } else {
      headers[key] = value;
    }
  });
  
  // Get response body
  const contentType = response.headers.get('content-type') || '';
  const isBase64 = isBase64Encoded(contentType);
  
  let body;
  if (isBase64) {
    const buffer = await response.arrayBuffer();
    body = Buffer.from(buffer).toString('base64');
  } else {
    body = await response.text();
  }
  
  
    const result = {
      statusCode: response.status,
      headers,
      body,
      isBase64Encoded: isBase64,
    };
    
    // Add cookies if present
    if (multiValueHeaders['set-cookie']) {
      result.cookies = multiValueHeaders['set-cookie'];
    }
    
    return result;
  
};

// Main handler function
export const createHandler = (app) => {
  return async (event, context) => {
    try {
      // Create Request from Lambda event
      const request = createRequest(event, context);
      
      // Process request with Hono app
      const response = await app.fetch(request, {
        event,
        context,
      });
      
      // Convert Response to Lambda result
      return await createResult(response, event);
    } catch (error) {
      console.error('Handler error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Internal Server Error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }),
      };
    }
  };
};

// Streaming handler for response streaming
export const createStreamHandler = (app) => {
  return async (event, responseStream, context) => {
    try {
      const request = createRequest(event, context);
      const response = await app.fetch(request, {
        event,
        context,
      });
      
      // Set content type
      const contentType = response.headers.get('content-type') || 'text/plain';
      responseStream.setContentType(contentType);
      
      // Stream the response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          responseStream.write(chunk);
        }
      } else {
        const text = await response.text();
        responseStream.write(text);
      }
      
      responseStream.end();
    } catch (error) {
      console.error('Stream handler error:', error);
      responseStream.setContentType('application/json');
      responseStream.write(JSON.stringify({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }));
      responseStream.end();
    }
  };
};