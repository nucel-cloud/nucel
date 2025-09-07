import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, twoFactor, multiSession, emailOTP } from "better-auth/plugins";
import { db } from "@nucel/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(
        "Send password reset email to:",
        user.email,
        "with url:",
        url,
      );
      // TODO: Integrate with email service
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60 * 24, // 24 hours
    }),
    twoFactor({
      issuer: "Nucel Studio",
    }),
    multiSession(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        console.log("Send OTP to:", email, "OTP:", otp, "Type:", type);
        // TODO: Integrate with email service
      },
      expiresIn: 60 * 10, // 10 minutes
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? [process.env.APP_URL || ""]
      : ["http://localhost:3000", "http://localhost:5173"],

  rateLimit: {
    window: 60,
    max: 100,
  },

  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN,
    },
  },
});

export type Auth = typeof auth;
