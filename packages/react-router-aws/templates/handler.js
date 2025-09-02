import { createRequestHandler } from '@react-router/architect';
import * as build from './index.js';

/**
 * AWS Lambda handler for React Router v7 application
 * Handles both API Gateway v2 and Lambda Function URL events
 * Compatible with React Router framework mode
 */
const reactRouterHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || 'production',
});

export const handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle Lambda Function URL format
    if (event.requestContext && !event.requestContext.stage) {
      // This is a Lambda Function URL event
      const { rawPath, headers, queryStringParameters, body, isBase64Encoded, requestContext } = event;
      
      // Convert to API Gateway v2 format that React Router expects
      const apiGatewayEvent = {
        version: '2.0',
        routeKey: '$default',
        rawPath: rawPath || '/',
        rawQueryString: queryStringParameters 
          ? new URLSearchParams(queryStringParameters).toString()
          : '',
        headers: headers || {},
        queryStringParameters: queryStringParameters || {},
        requestContext: {
          accountId: 'anonymous',
          apiId: 'function-url',
          domainName: headers?.host || 'localhost',
          domainPrefix: 'function-url',
          http: {
            method: requestContext?.http?.method || 'GET',
            path: rawPath || '/',
            protocol: 'HTTP/1.1',
            sourceIp: headers?.['x-forwarded-for']?.split(',')[0]?.trim() || '127.0.0.1',
            userAgent: headers?.['user-agent'] || '',
          },
          requestId: context.awsRequestId,
          routeKey: '$default',
          stage: '$default',
          time: new Date().toISOString(),
          timeEpoch: Date.now(),
        },
        body: body,
        isBase64Encoded: isBase64Encoded || false,
      };
      
      const response = await reactRouterHandler(apiGatewayEvent, context);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      // Ensure response is in Lambda Function URL format
      if (!response.statusCode) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html',
          },
          body: response,
        };
      }
      
      return response;
    }
    
    // Handle API Gateway v2 format (with stage in path)
    if (event.requestContext?.stage && event.rawPath) {
      // Remove stage from path if present
      const stage = event.requestContext.stage;
      if (event.rawPath.startsWith(`/${stage}`)) {
        event.rawPath = event.rawPath.replace(`/${stage}`, '') || '/';
        if (event.requestContext.http?.path) {
          event.requestContext.http.path = event.requestContext.http.path.replace(`/${stage}`, '') || '/';
        }
      }
    }
    
    // Call the React Router handler
    const response = await reactRouterHandler(event, context);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Ensure response is in proper format
    if (!response.statusCode) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
        },
        body: response,
      };
    }
    
    return response;
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      }),
    };
  }
};