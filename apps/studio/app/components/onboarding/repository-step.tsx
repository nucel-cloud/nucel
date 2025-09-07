import { useState } from "react";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Input } from "@nucel.cloud/design-system/components/ui/input";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { FolderGit2, Search, Lock, GitBranch, ChevronRight } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  default_branch: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  installation_id?: number;
  is_deployed?: boolean;
}

interface RepositoryStepProps {
  githubInstallations: any;
  onComplete: () => void;
}

// Mock repositories for demo
const mockRepositories: Repository[] = [
  {
    id: 1,
    name: "my-nextjs-app",
    full_name: "user/my-nextjs-app",
    owner: {
      login: "user",
      avatar_url: "https://github.com/github.png",
    },
    private: false,
    default_branch: "main",
    description: "A Next.js application with TypeScript",
    language: "TypeScript",
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "sveltekit-blog",
    full_name: "user/sveltekit-blog",
    owner: {
      login: "user",
      avatar_url: "https://github.com/github.png",
    },
    private: true,
    default_branch: "main",
    description: "Personal blog built with SvelteKit",
    language: "JavaScript",
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    name: "react-dashboard",
    full_name: "user/react-dashboard",
    owner: {
      login: "user",
      avatar_url: "https://github.com/github.png",
    },
    private: false,
    default_branch: "main",
    description: "Admin dashboard built with React and Vite",
    language: "TypeScript",
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export function RepositoryStep({ githubInstallations, onComplete }: RepositoryStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repositories] = useState<Repository[]>(mockRepositories);

  const filteredRepos = repositories.filter((repo) => {
    const query = searchQuery.toLowerCase();
    return (
      repo.full_name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query)
    );
  });

  const handleSelectRepository = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const handleContinue = () => {
    if (selectedRepo) {
      // TODO: Save selected repository
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <FolderGit2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Select a Repository</h2>
        <p className="text-muted-foreground">
          Choose a repository to deploy from your GitHub account.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredRepos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No repositories match your search" : "No repositories found"}
            </p>
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <Card
              key={repo.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedRepo?.id === repo.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectRepository(repo)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{repo.full_name}</h4>
                      {repo.private && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="mr-1 h-3 w-3" />
                          Private
                        </Badge>
                      )}
                      {repo.is_deployed && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Deployed
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary/50" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {repo.default_branch}
                      </span>
                      <span>
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedRepo && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-1">Selected Repository:</p>
          <p className="font-mono text-sm">{selectedRepo.full_name}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedRepo}>
          Continue to Configuration
        </Button>
      </div>
    </div>
  );
}