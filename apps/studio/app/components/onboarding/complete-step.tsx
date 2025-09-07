import React, { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Alert, AlertDescription } from "@nucel.cloud/design-system/components/ui/alert";
import { Sparkles, Loader2, CheckCircle2, XCircle, ExternalLink, GitBranch, Info } from "lucide-react";

interface CompleteStepProps {
  onGetStarted: () => void;
  projectData?: {
    id: string;
    name: string;
    repository: string;
  };
}

export function CompleteStep({ onGetStarted, projectData }: CompleteStepProps) {
  const fetcher = useFetcher();
  const [workflowStatus, setWorkflowStatus] = useState<"waiting" | "running" | "success" | "failed">("waiting");
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [workflowUrl, setWorkflowUrl] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const maxChecks = 60; // Check for up to 5 minutes (60 * 5 seconds)
  
  useEffect(() => {
    if ((workflowStatus === "waiting" || workflowStatus === "running") && checkCount < maxChecks) {
      const timer = setTimeout(() => {
        // Check workflow status
        const formData = new FormData();
        formData.append("actionType", "check-workflow");
        if (projectData?.repository) {
          formData.append("repository", projectData.repository);
        }
        fetcher.submit(formData, { method: "post" });
        setCheckCount(prev => prev + 1);
      }, 5000); // Check every 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [workflowStatus, checkCount, fetcher, projectData]);
  
  useEffect(() => {
    if (fetcher.data?.workflowStatus) {
      setWorkflowStatus(fetcher.data.workflowStatus);
      if (fetcher.data.deploymentUrl) {
        setDeploymentUrl(fetcher.data.deploymentUrl);
      }
      if (fetcher.data.workflowUrl) {
        setWorkflowUrl(fetcher.data.workflowUrl);
      }
      if (fetcher.data.failureReason) {
        setFailureReason(fetcher.data.failureReason);
      }
    }
  }, [fetcher.data]);
  
  const handleGetStarted = () => {
    // Mark onboarding as complete
    const formData = new FormData();
    formData.append("actionType", "complete-step");
    formData.append("step", "complete");
    fetcher.submit(formData, { method: "post" });
    onGetStarted();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Nucel! 🎉</h2>
        <p className="text-muted-foreground text-lg">
          Your project is set up and ready to deploy.
        </p>
      </div>

      {/* Workflow Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {workflowStatus === "waiting" && (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mt-0.5" />
            )}
            {workflowStatus === "running" && (
              <Loader2 className="w-6 h-6 animate-spin text-yellow-500 mt-0.5" />
            )}
            {workflowStatus === "success" && (
              <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5" />
            )}
            {workflowStatus === "failed" && (
              <XCircle className="w-6 h-6 text-red-500 mt-0.5" />
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                {workflowStatus === "waiting" && "Waiting for GitHub Actions workflow..."}
                {workflowStatus === "running" && "Deployment in progress..."}
                {workflowStatus === "success" && "Deployment successful!"}
                {workflowStatus === "failed" && "Deployment failed"}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {workflowStatus === "waiting" && "Push to your repository to trigger the first deployment"}
                {workflowStatus === "running" && "GitHub Actions is building and deploying your application"}
                {workflowStatus === "success" && "Your application is now live and accessible"}
                {workflowStatus === "failed" && (
                  failureReason === "cancelled" 
                    ? "The workflow was cancelled"
                    : failureReason === "timed_out"
                    ? "The workflow timed out"
                    : "The deployment failed. Check the GitHub Actions logs for details"
                )}
              </p>
              
              {(projectData?.repository || workflowUrl) && (
                <div className="flex items-center gap-4 text-sm">
                  <a
                    href={workflowUrl || `https://github.com/${projectData?.repository}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <GitBranch className="w-4 h-4" />
                    {workflowUrl ? "View Workflow Run" : "View GitHub Actions"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  
                  {deploymentUrl && (
                    <a
                      href={deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View Live Site
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {workflowStatus === "waiting" && checkCount > 12 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No workflow detected yet. Make sure to push to your repository's default branch to trigger the deployment.
            The workflow file was added at <code>.github/workflows/nucel-deploy.yml</code>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleGetStarted}
          disabled={workflowStatus === "running"}
        >
          {workflowStatus === "running" ? "Please wait..." : "Go to Dashboard"}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Need help? Check out our <a href="#" className="underline">documentation</a> or <a href="#" className="underline">join our community</a>.</p>
      </div>
    </div>
  );
}