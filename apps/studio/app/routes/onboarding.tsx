import React, { useState } from "react";
import { useNavigate, Form } from "react-router";
import type { Route } from "./+types/onboarding";
import { requireUser } from "~/lib/sessions.server";
import { 
  getOrCreateOnboardingProgress,
  isOnboardingComplete,
  updateOnboardingStep,
  getUserGitHubInstallations,
  getUserAWSAccounts,
  saveGitHubInstallation,
  saveAWSAccount,
  generateExternalId,
  generateCloudFormationUrl,
  type OnboardingStep 
} from "~/lib/onboarding.server";
import { NucelGitHubApp } from "@nucel.cloud/github-app";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Progress } from "@nucel.cloud/design-system/components/ui/progress";
import { cn } from "@nucel.cloud/design-system/lib/utils";
import { CheckCircle2, Github, Cloud, FolderGit2, Settings2, Sparkles } from "lucide-react";
import { GitHubStep } from "~/components/onboarding/github-step";
import { AWSStep } from "~/components/onboarding/aws-step";
import { RepositoryStep } from "~/components/onboarding/repository-step";
import { ConfigureStep } from "~/components/onboarding/configure-step";
import { CompleteStep } from "~/components/onboarding/complete-step";

// Server loader - runs only on server
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const stepParam = url.searchParams.get("step");

  // Get or create onboarding progress
  const progress = await getOrCreateOnboardingProgress(user.id);

  // Check if onboarding is already complete
  if (isOnboardingComplete(progress)) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/dashboard" },
    });
  }

  // Get GitHub installations
  const githubInstallations = await getUserGitHubInstallations(user.id);

  // Get AWS accounts
  const awsAccounts = await getUserAWSAccounts(user.id);

  // Override progress step if URL parameter is provided
  let currentStep = progress.currentStep;
  if (stepParam && ["github", "aws", "repository", "configure", "complete"].includes(stepParam)) {
    currentStep = stepParam as OnboardingStep;
  }

  return {
    user,
    progress: {
      ...progress,
      currentStep,
    },
    githubInstallations,
    awsAccounts,
  };
}

// Server action - runs only on server
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  switch (actionType) {
    case "complete-step": {
      const step = formData.get("step") as OnboardingStep;
      await updateOnboardingStep(user.id, step);
      break;
    }

    case "github-install": {
      const installationId = formData.get("installationId");
      const accountLogin = formData.get("accountLogin");
      const accountType = formData.get("accountType");
      const accountAvatarUrl = formData.get("accountAvatarUrl");

      if (installationId && accountLogin) {
        await saveGitHubInstallation(user.id, {
          installationId: Number(installationId),
          accountLogin: String(accountLogin),
          accountType: String(accountType) || "User",
          accountAvatarUrl: accountAvatarUrl ? String(accountAvatarUrl) : null,
        });
        
        // Mark GitHub step as complete
        await updateOnboardingStep(user.id, "github");
        
        return { success: true };
      }
      break;
    }

    case "aws-connect": {
      const accountId = formData.get("accountId");
      const roleArn = formData.get("roleArn");
      const externalId = formData.get("externalId");
      const accountAlias = formData.get("accountAlias");
      const region = formData.get("region");
      const stackName = formData.get("stackName");

      if (accountId && roleArn && externalId) {
        await saveAWSAccount(user.id, {
          accountId: String(accountId),
          roleArn: String(roleArn),
          externalId: String(externalId),
          accountAlias: accountAlias ? String(accountAlias) : null,
          region: region ? String(region) : "us-east-1",
          stackName: stackName ? String(stackName) : null,
        });
        
        // Mark AWS step as complete
        await updateOnboardingStep(user.id, "aws");
        
        return { success: true };
      }
      break;
    }

    case "generate-aws-url": {
      const externalId = generateExternalId();
      const region = formData.get("region") as string || "us-east-1";
      const url = generateCloudFormationUrl(externalId, region);
      return { externalId, cloudFormationUrl: url };
    }

    case "fetch-repositories": {
      const installationIds = JSON.parse(formData.get("installationIds") as string || "[]");
      
      try {
        // Initialize GitHub App
        const githubApp = new NucelGitHubApp({
          appId: process.env.GITHUB_APP_ID!,
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
          webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
        });

        const allRepos = [];
        
        // Fetch repositories for each installation
        for (const installationId of installationIds) {
          const octokit = await githubApp.getInstallationOctokit(installationId);
          
          // Get repositories for this installation
          const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
            per_page: 100,
          });
          
          allRepos.push(...data.repositories);
        }
        
        return { repositories: allRepos };
      } catch (error) {
        console.error("Error fetching repositories:", error);
        return { error: "Failed to fetch repositories", repositories: [] };
      }
    }
  }

  return { success: true };
}

const steps = [
  { id: "github", label: "Connect GitHub", icon: Github },
  { id: "aws", label: "Connect AWS", icon: Cloud },
  { id: "repository", label: "Select Repository", icon: FolderGit2 },
  { id: "configure", label: "Configure Deployment", icon: Settings2 },
  { id: "complete", label: "Complete", icon: Sparkles },
];

export default function Onboarding({ loaderData }: Route.ComponentProps) {
  const { user, progress, githubInstallations, awsAccounts } = loaderData;
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(progress.currentStep);

  // Update current step when progress changes (from URL params)
  React.useEffect(() => {
    setCurrentStep(progress.currentStep);
  }, [progress.currentStep]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const handleStepComplete = async (step: OnboardingStep) => {
    const nextStepIndex = steps.findIndex((s) => s.id === step) + 1;
    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex].id;
      setCurrentStep(nextStep as OnboardingStep);
      // Update URL to reflect the new step
      navigate(`/onboarding?step=${nextStep}`, { replace: true });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "github":
        return (
          <GitHubStep
            installations={githubInstallations}
            onComplete={() => handleStepComplete("github")}
          />
        );
      case "aws":
        return (
          <AWSStep
            accounts={awsAccounts}
            onComplete={() => handleStepComplete("aws")}
          />
        );
      case "repository":
        return (
          <RepositoryStep
            githubInstallations={githubInstallations}
            onComplete={() => handleStepComplete("repository")}
          />
        );
      case "configure":
        return (
          <ConfigureStep onComplete={() => handleStepComplete("configure")} />
        );
      case "complete":
        return <CompleteStep onGetStarted={() => navigate("/dashboard")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Nucel</h1>
          <p className="text-muted-foreground">
            Let's get you set up to deploy your first application
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const canNavigate = isCompleted || isCurrent;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 text-sm transition-colors",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground font-medium",
                    !isCompleted && !isCurrent && "text-muted-foreground",
                    canNavigate && "cursor-pointer hover:opacity-70"
                  )}
                  onClick={() => canNavigate && navigate(`/onboarding?step=${step.id}`)}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary",
                      !isCompleted && !isCurrent && "border-muted"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Skip button for development */}
        {process.env.NODE_ENV === "development" && currentStep !== "complete" && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < steps.length) {
                  setCurrentStep(steps[nextIndex].id as OnboardingStep);
                }
              }}
            >
              Skip this step (dev only)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}