import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nucel.cloud/design-system/components/ui/card";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Input } from "@nucel.cloud/design-system/components/ui/input";
import { Label } from "@nucel.cloud/design-system/components/ui/label";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { Github, Globe, Package, Terminal, FolderOutput } from "lucide-react";

interface ProjectSettingsProps {
  project: {
    id: string;
    name: string;
    githubRepo: string;
    framework?: string | null;
    buildCommand?: string | null;
    outputDirectory?: string | null;
    installCommand?: string | null;
    nodeVersion?: string | null;
    defaultBranch?: string | null;
    domains?: string | null;
    awsRegion?: string | null;
  };
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const domains = project.domains ? JSON.parse(project.domains) : [];
  
  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic project configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={project.name} disabled />
            </div>
            
            <div className="space-y-2">
              <Label>Framework</Label>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{project.framework}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>GitHub Repository</Label>
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{project.githubRepo}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Default Branch</Label>
              <Input value={project.defaultBranch || 'main'} disabled />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Build Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Build Configuration</CardTitle>
          <CardDescription>Commands and settings for building your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Install Command
              </Label>
              <Input value={project.installCommand || 'npm ci'} disabled />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Build Command
              </Label>
              <Input value={project.buildCommand || 'npm run build'} disabled />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOutput className="h-4 w-4" />
                Output Directory
              </Label>
              <Input value={project.outputDirectory || 'dist'} disabled />
            </div>
            
            <div className="space-y-2">
              <Label>Node Version</Label>
              <Input value={project.nodeVersion || '20'} disabled />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription>Custom domains for your project</CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length > 0 ? (
            <div className="space-y-2">
              {domains.map((domain: string) => (
                <div key={domain} className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {domain}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No custom domains configured</p>
          )}
        </CardContent>
      </Card>
      
      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}