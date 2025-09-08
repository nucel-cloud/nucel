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

// Type for setup status
interface SetupStatus {
  projectCreated: boolean;
  secretsConfigured: boolean;
  workflowCreated: boolean;
}
import { createProject, setupGitHubSecrets, createGitHubWorkflow } from "~/lib/projects.server";
import { NucelGitHubApp } from "@nucel.cloud/github-app";
import { db, onboardingProgress, deployment } from "@nucel/database";
import { eq } from "drizzle-orm";
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
      let setupStatus: SetupStatus | null = null;
      
      // Save additional data based on the step
      if (step === "repository") {
        const repositoryId = formData.get("repositoryId");
        const repositoryName = formData.get("repositoryName");
        
        // Store repository selection in session or temporary storage
        // We'll create the project when configure step is completed
        const progress = await getOrCreateOnboardingProgress(user.id);
        const metadata = progress.metadata || {};
        metadata.selectedRepository = {
          id: repositoryId,
          name: repositoryName,
        };
        
        // Update onboarding progress with selected repository
        await db
          .update(onboardingProgress)
          .set({ 
            metadata: JSON.stringify(metadata),
            updatedAt: new Date(),
          })
          .where(eq(onboardingProgress.userId, user.id));
          
      } else if (step === "configure") {
        const projectName = formData.get("projectName");
        const framework = formData.get("framework");
        const buildCommand = formData.get("buildCommand");
        const outputDirectory = formData.get("outputDirectory");
        const installCommand = formData.get("installCommand");
        const nodeVersion = formData.get("nodeVersion") || "20";
        
        // Get the selected repository from progress metadata
        const progress = await getOrCreateOnboardingProgress(user.id);
        const metadata = progress.metadata || {} as Record<string, any>;
        const selectedRepo = metadata.selectedRepository as {
          id: string;
          name: string;
        } | undefined;
        
        if (!selectedRepo) {
          throw new Error("No repository selected");
        }
        
        // Get GitHub installation and AWS account
        const githubInstalls = await getUserGitHubInstallations(user.id);
        const awsAccounts = await getUserAWSAccounts(user.id);
        
        if (!githubInstalls.installations.length || !awsAccounts.length) {
          throw new Error("GitHub or AWS not configured");
        }
        
        // Create the project
        const projectId = await createProject({
          userId: user.id,
          name: String(projectName),
          repository: selectedRepo.name,
          repositoryId: Number(selectedRepo.id),
          githubInstallationId: githubInstalls.installations[0].id,
          awsAccountId: awsAccounts[0].id,
          framework: String(framework),
          buildCommand: buildCommand ? String(buildCommand) : undefined,
          outputDirectory: outputDirectory ? String(outputDirectory) : undefined,
          installCommand: installCommand ? String(installCommand) : undefined,
          nodeVersion: String(nodeVersion),
        });
        
        // Store project data in metadata for complete step
        metadata.projectData = {
          id: projectId,
          name: String(projectName),
          repository: selectedRepo.name,
        };
        
        // Setup GitHub secrets and workflow file
        setupStatus = {
          projectCreated: true,
          secretsConfigured: false,
          workflowCreated: false,
        };
        
        // Try to set up secrets
        try {
          await setupGitHubSecrets(projectId, user.id);
          setupStatus.secretsConfigured = true;
        } catch (secretsError) {
          console.error("Error setting up GitHub secrets:", secretsError);
          // Continue to try workflow even if secrets fail
        }
        
        // Try to create workflow file
        try {
          await createGitHubWorkflow(projectId, user.id);
          setupStatus.workflowCreated = true;
        } catch (workflowError) {
          console.error("Error creating workflow file:", workflowError);
        }
        
        // Update metadata with project data
        await db
          .update(onboardingProgress)
          .set({ 
            metadata: JSON.stringify(metadata),
            updatedAt: new Date(),
          })
          .where(eq(onboardingProgress.userId, user.id));
        
        // If neither secrets nor workflow were created, return with warning
        if (!setupStatus.secretsConfigured || !setupStatus.workflowCreated) {
          return {
            success: true,
            setupStatus,
            warning: "Project created! However, GitHub Actions setup was incomplete. Please ensure the GitHub App has 'Secrets' and 'Contents' write permissions, then configure manually from project settings.",
          };
        }
      }
      
      await updateOnboardingStep(user.id, step);
      
      // Return setupStatus if it exists (from configure step)
      if (step === "configure" && setupStatus) {
        return { success: true, setupStatus };
      }
      
      return { success: true };
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
      
      // Get GitHub installation to get the organization/username
      const githubInstalls = await getUserGitHubInstallations(user.id);
      const githubOrg = githubInstalls.installations[0]?.account.login;
      
      const url = generateCloudFormationUrl(externalId, region, githubOrg);
      return { externalId, cloudFormationUrl: url };
    }

    case "check-workflow": {
      const repository = formData.get("repository") as string;
      
      if (!repository) {
        return { workflowStatus: "waiting" };
      }
      
      try {
        // Get GitHub installation for this repository
        const [owner, repo] = repository.split("/");
        const installations = await getUserGitHubInstallations(user.id);
        
        if (installations.installations.length === 0) {
          return { workflowStatus: "waiting" };
        }
        
        // Initialize GitHub App
        const githubApp = new NucelGitHubApp({
          appId: process.env.GITHUB_APP_ID!,
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
          webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
        });
        
        // Check for workflow runs - specifically for Nucel deployment workflow
        const octokit = await githubApp.getInstallationOctokit(installations.installations[0].id);
        const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
          owner,
          repo,
          workflow_id: "nucel-deploy.yml", // Only check our specific workflow
          per_page: 5, // Get a few recent runs in case the latest isn't ours
        });
        
        if (runs.workflow_runs.length === 0) {
          return { workflowStatus: "waiting" };
        }
        
        const latestRun = runs.workflow_runs[0];
        
        console.log(`[Workflow Check] Status: ${latestRun.status}, Conclusion: ${latestRun.conclusion}`);
        
        if (latestRun.status === "completed") {
          if (latestRun.conclusion === "success") {
            // Try to get deployment URL from deployment records
            const deployments = await db
              .select()
              .from(deployment)
              .where(eq(deployment.commitSha, latestRun.head_sha))
              .limit(1);
            
            return { 
              workflowStatus: "success",
              deploymentUrl: deployments[0]?.deploymentUrl || null,
              workflowUrl: latestRun.html_url,
            };
          } else if (latestRun.conclusion === "failure" || latestRun.conclusion === "cancelled" || latestRun.conclusion === "timed_out") {
            return { 
              workflowStatus: "failed",
              workflowUrl: latestRun.html_url,
              failureReason: latestRun.conclusion,
            };
          } else {
            // Could be skipped or other status
            return { workflowStatus: "waiting" };
          }
        } else if (latestRun.status === "queued" || latestRun.status === "waiting" || latestRun.status === "pending") {
          return { workflowStatus: "waiting" };
        } else if (latestRun.status === "in_progress") {
          return { 
            workflowStatus: "running",
            workflowUrl: latestRun.html_url,
          };
        } else {
          return { workflowStatus: "waiting" };
        }
      } catch (error) {
        console.error("Error checking workflow:", error);
        return { workflowStatus: "waiting" };
      }
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
        return <CompleteStep onGetStarted={() => navigate("/dashboard")} projectData={progress.metadata?.projectData} />;
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