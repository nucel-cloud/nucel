import { useState, useEffect } from "react";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { CheckCircle2, Github, ExternalLink, RefreshCw } from "lucide-react";

interface GitHubStepProps {
  installations: {
    installed: boolean;
    installations: Array<{
      id: number;
      account: {
        login: string;
        type: string;
        avatar_url: string;
      };
      repository_selection: "all" | "selected";
    }>;
    appName?: string;
    appSlug?: string;
  };
  onComplete: () => void;
}

export function GitHubStep({ installations, onComplete }: GitHubStepProps) {
  const [checking, setChecking] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const appSlug = installations.appSlug || process.env.GITHUB_APP_SLUG || "nucel-cloud";
  const installUrl = `https://github.com/apps/${appSlug}/installations/new`;

  useEffect(() => {
    // Clear polling on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const handleInstallClick = () => {
    // Open GitHub App installation in new tab
    window.open(installUrl, "_blank");
    
    // Start polling for installation
    setChecking(true);
    const interval = setInterval(() => {
      // Poll for installation completion by reloading the page
      window.location.reload();
    }, 3000);
    
    setPollInterval(interval);
    
    // Stop polling after 2 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setChecking(false);
        setPollInterval(null);
      }
    }, 120000);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (installations.installed && installations.installations.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">GitHub Connected</h2>
          <p className="text-muted-foreground">
            Your GitHub account is connected and ready to deploy repositories.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Connected Installations</h3>
          {installations.installations.map((installation) => (
            <Card key={installation.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={installation.account.avatar_url}
                    alt={installation.account.login}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{installation.account.login}</p>
                    <p className="text-sm text-muted-foreground">
                      {installation.account.type} · {installation.repository_selection === "all" ? "All repositories" : "Selected repositories"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleInstallClick}
          >
            <Github className="w-4 h-4 mr-2" />
            Add Another Installation
          </Button>
          <Button onClick={onComplete}>
            Continue to AWS Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <Github className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Connect Your GitHub Account</h2>
        <p className="text-muted-foreground">
          Install the Nucel GitHub App to deploy repositories from your account or organization.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-medium">What permissions are granted?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Read access to code and metadata</li>
          <li>• Write access to webhooks and deployments</li>
          <li>• Receive events for pushes and pull requests</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          size="lg" 
          onClick={handleInstallClick}
          disabled={checking}
          className="w-full"
        >
          {checking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking Installation...
            </>
          ) : (
            <>
              <Github className="w-4 h-4 mr-2" />
              Install GitHub App
              <ExternalLink className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        {checking && (
          <p className="text-sm text-center text-muted-foreground">
            Complete the installation in the popup window. This page will update automatically.
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  );
}