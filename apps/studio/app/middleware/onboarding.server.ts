import { getSession } from "~/lib/sessions.server";
import { db, onboardingProgress } from "@nucel/database";
import { eq } from "drizzle-orm";

export async function requireOnboarding(request: Request) {
  const session = await getSession(request);
  
  if (!session?.user?.id) {
    // Not authenticated, let auth middleware handle it
    return null;
  }

  // Check if user has completed onboarding
  const progress = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, session.user.id))
    .limit(1);

  const userProgress = progress[0];
  
  // Check if onboarding is complete
  const isComplete = userProgress?.currentStep === "complete" && 
                    userProgress?.githubConnected && 
                    userProgress?.awsConnected && 
                    userProgress?.repositorySelected && 
                    userProgress?.projectConfigured;

  if (!isComplete) {
    // User needs to complete onboarding
    const url = new URL(request.url);
    
    // Allow access to onboarding, auth routes, and API routes
    const allowedPaths = ['/onboarding', '/login', '/signup', '/api/auth', '/logout'];
    const isAllowed = allowedPaths.some(path => url.pathname.startsWith(path));
    
    if (!isAllowed) {
      // Redirect to onboarding
      throw new Response(null, { 
        status: 302, 
        headers: { Location: '/onboarding' } 
      });
    }
  }

  return { onboardingComplete: isComplete };
}

export async function checkOnboardingStatus(request: Request) {
  const session = await getSession(request);
  
  if (!session?.user?.id) {
    return { needsOnboarding: false, isAuthenticated: false };
  }

  const progress = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, session.user.id))
    .limit(1);

  const userProgress = progress[0];
  
  const isComplete = userProgress?.currentStep === "complete" && 
                    userProgress?.githubConnected && 
                    userProgress?.awsConnected && 
                    userProgress?.repositorySelected && 
                    userProgress?.projectConfigured;

  return { 
    needsOnboarding: !isComplete,
    isAuthenticated: true,
    currentStep: userProgress?.currentStep || 'github'
  };
}