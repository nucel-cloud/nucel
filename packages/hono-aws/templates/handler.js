import { createHandler, createStreamHandler } from './lambda-handler.js';
import * as app from './index.js';

// Check if the app exports a Hono instance or handler directly
const honoApp = app.app || app.default || app;

// Determine if streaming is enabled based on environment variable
const isStreaming = process.env.HONO_STREAMING === 'true';

// Export the appropriate handler based on streaming configuration
export const handler = isStreaming ? createStreamHandler(honoApp) : createHandler(honoApp);