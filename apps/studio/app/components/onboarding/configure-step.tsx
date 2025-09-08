import React, { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Input } from "@nucel.cloud/design-system/components/ui/input";
import { Label } from "@nucel.cloud/design-system/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nucel.cloud/design-system/components/ui/select";
import { Textarea } from "@nucel.cloud/design-system/components/ui/textarea";
import { Alert, AlertDescription } from "@nucel.cloud/design-system/components/ui/alert";
import { Settings2, Info, Zap, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ConfigureStepProps {
  onComplete: () => void;
}

const frameworks = [
  { value: "react-router", label: "React Router", buildCommand: "npm run build", outputDir: "build" },
  { value: "nextjs", label: "Next.js", buildCommand: "npm run build", outputDir: ".next" },
  { value: "sveltekit", label: "SvelteKit", buildCommand: "npm run build", outputDir: "build" },
  { value: "react", label: "React (Vite)", buildCommand: "npm run build", outputDir: "dist" },
  { value: "vue", label: "Vue.js", buildCommand: "npm run build", outputDir: "dist" },
  { value: "static", label: "Static Site", buildCommand: "", outputDir: "" },
  { value: "custom", label: "Custom", buildCommand: "", outputDir: "" },
];

export function ConfigureStep({ onComplete }: ConfigureStepProps) {
  const fetcher = useFetcher();
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("react-router");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDirectory, setOutputDirectory] = useState("build");
  const [installCommand, setInstallCommand] = useState("npm install");
  const [envVars, setEnvVars] = useState("");
  const [setupProgress, setSetupProgress] = useState<{
    creating: boolean;
    secrets: boolean;
    workflow: boolean;
    completed: boolean;
  }>({
    creating: false,
    secrets: false,
    workflow: false,
    completed: false,
  });

  const handleFrameworkChange = (value: string) => {
    setFramework(value);
    const fw = frameworks.find((f) => f.value === value);
    if (fw) {
      setBuildCommand(fw.buildCommand);
      setOutputDirectory(fw.outputDir);
    }
  };

  const handleDeploy = async () => {
    if (!projectName) {
      alert("Please enter a project name");
      return;
    }
    
    // Show progress
    setSetupProgress({ creating: true, secrets: false, workflow: false, completed: false });
    
    // Submit form to mark configure step as complete
    const formData = new FormData();
    formData.append("actionType", "complete-step");
    formData.append("step", "configure");
    formData.append("projectName", projectName);
    formData.append("framework", framework);
    formData.append("buildCommand", buildCommand);
    formData.append("outputDirectory", outputDirectory);
    formData.append("installCommand", installCommand);
    formData.append("envVars", envVars);
    fetcher.submit(formData, { method: "post" });
  };

  // Watch for fetcher state changes to update progress
  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      // Always update progress based on actual setup status
      const status = fetcher.data.setupStatus;
      if (status) {
        setSetupProgress({
          creating: status.projectCreated,
          secrets: status.secretsConfigured,
          workflow: status.workflowCreated,
          completed: true,
        });
        
        // Wait longer if there's a warning so user can see what failed
        setTimeout(() => {
          onComplete();
        }, fetcher.data.warning ? 4000 : 1500);
      }
    }
  }, [fetcher.state, fetcher.data, onComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <Settings2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Configure Your Deployment</h2>
        <p className="text-muted-foreground">
          Set up build settings and environment variables for your project.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            placeholder="my-awesome-app"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be used as your project identifier
          </p>
        </div>

        <div>
          <Label htmlFor="framework">Framework</Label>
          <Select value={framework} onValueChange={handleFrameworkChange}>
            <SelectTrigger id="framework">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map((fw) => (
                <SelectItem key={fw.value} value={fw.value}>
                  {fw.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            We'll automatically detect and configure your framework
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="install-command">Install Command</Label>
            <Input
              id="install-command"
              placeholder="npm install"
              value={installCommand}
              onChange={(e) => setInstallCommand(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="build-command">Build Command</Label>
            <Input
              id="build-command"
              placeholder="npm run build"
              value={buildCommand}
              onChange={(e) => setBuildCommand(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="output-directory">Output Directory</Label>
          <Input
            id="output-directory"
            placeholder=".next, dist, build, etc."
            value={outputDirectory}
            onChange={(e) => setOutputDirectory(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            The directory where your build output is located
          </p>
        </div>

        <div>
          <Label htmlFor="env-vars">Environment Variables (Optional)</Label>
          <Textarea
            id="env-vars"
            placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            One per line in KEY=value format
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Don't worry, you can change these settings anytime from your project dashboard.
        </AlertDescription>
      </Alert>

      {/* Show setup progress if deploying */}
      {(setupProgress.creating || fetcher.state !== "idle") && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              {setupProgress.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : setupProgress.creating ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
              <span className={setupProgress.creating ? "text-green-600" : ""}>
                Creating project...
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {setupProgress.secrets ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : setupProgress.creating ? (
                fetcher.data?.warning ? (
                  <XCircle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                )
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span className={setupProgress.secrets ? "text-green-600" : ""}>
                Setting up GitHub secrets...
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {setupProgress.workflow ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : setupProgress.secrets ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span className={setupProgress.workflow ? "text-green-600" : ""}>
                Creating deployment workflow...
              </span>
            </div>

            {fetcher.data?.warning && (
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {fetcher.data.warning}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={fetcher.state !== "idle"}>
          Back
        </Button>
        <Button 
          onClick={handleDeploy} 
          disabled={!projectName || fetcher.state !== "idle"}
        >
          {fetcher.state !== "idle" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Deploy Project
            </>
          )}
        </Button>
      </div>
    </div>
  );
}