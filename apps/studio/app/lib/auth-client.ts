import { createAuthClient } from "better-auth/react";

// Get base URL - use environment variable or default to localhost
// VITE_APP_URL should be set in .env file
const baseURL = import.meta.env.VITE_APP_URL || "http://localhost:5173";

export const authClient = createAuthClient({
  baseURL: baseURL + "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
