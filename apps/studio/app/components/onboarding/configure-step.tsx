import { useState } from "react";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Input } from "@nucel.cloud/design-system/components/ui/input";
import { Label } from "@nucel.cloud/design-system/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nucel.cloud/design-system/components/ui/select";
import { Textarea } from "@nucel.cloud/design-system/components/ui/textarea";
import { Alert, AlertDescription } from "@nucel.cloud/design-system/components/ui/alert";
import { Settings2, Info, Zap } from "lucide-react";

interface ConfigureStepProps {
  onComplete: () => void;
}

const frameworks = [
  { value: "nextjs", label: "Next.js", buildCommand: "npm run build", outputDir: ".next" },
  { value: "sveltekit", label: "SvelteKit", buildCommand: "npm run build", outputDir: "build" },
  { value: "react", label: "React (Vite)", buildCommand: "npm run build", outputDir: "dist" },
  { value: "vue", label: "Vue.js", buildCommand: "npm run build", outputDir: "dist" },
  { value: "static", label: "Static Site", buildCommand: "", outputDir: "" },
  { value: "custom", label: "Custom", buildCommand: "", outputDir: "" },
];

export function ConfigureStep({ onComplete }: ConfigureStepProps) {
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDirectory, setOutputDirectory] = useState(".next");
  const [installCommand, setInstallCommand] = useState("npm install");
  const [envVars, setEnvVars] = useState("");

  const handleFrameworkChange = (value: string) => {
    setFramework(value);
    const fw = frameworks.find((f) => f.value === value);
    if (fw) {
      setBuildCommand(fw.buildCommand);
      setOutputDirectory(fw.outputDir);
    }
  };

  const handleDeploy = () => {
    if (!projectName) {
      alert("Please enter a project name");
      return;
    }
    // TODO: Save configuration and trigger first deployment
    onComplete();
  };

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

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Back
        </Button>
        <Button onClick={handleDeploy} disabled={!projectName}>
          <Zap className="w-4 h-4 mr-2" />
          Deploy Project
        </Button>
      </div>
    </div>
  );
}