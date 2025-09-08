import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Input } from "@nucel.cloud/design-system/components/ui/input";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { FolderGit2, Search, Lock, GitBranch, ChevronRight, RefreshCw } from "lucide-react";

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

export function RepositoryStep({ githubInstallations, onComplete }: RepositoryStepProps) {
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // Track if we've fetched

  const fetchRepositories = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the GitHub webhook server API to get repositories
      const installationIds = githubInstallations.installations.map((i: any) => i.id);
      
      // For now, we'll use a fetcher to get repositories
      const formData = new FormData();
      formData.append("actionType", "fetch-repositories");
      formData.append("installationIds", JSON.stringify(installationIds));
      fetcher.submit(formData, { method: "post" });
    } catch (err) {
      setError("Failed to fetch repositories");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch repositories for all installations only once
    if (githubInstallations?.installations?.length > 0 && !hasFetched) {
      setHasFetched(true);
      fetchRepositories();
    } else if (!githubInstallations?.installations?.length && !hasFetched) {
      setHasFetched(true);
      setError("No GitHub installations found");
    }
  }, [githubInstallations, hasFetched]); // Depend on installations and hasFetched flag

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && 'repositories' in fetcher.data) {
      setRepositories(fetcher.data.repositories);
      setLoading(false);
    } else if (fetcher.data && 'error' in fetcher.data) {
      setError(fetcher.data.error);
      setLoading(false);
    }
  }, [fetcher.data]);

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
      // Submit form to mark repository step as complete
      const formData = new FormData();
      formData.append("actionType", "complete-step");
      formData.append("step", "repository");
      formData.append("repositoryId", selectedRepo.id.toString());
      formData.append("repositoryName", selectedRepo.full_name);
      fetcher.submit(formData, { method: "post" });
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
        {(loading || fetcher.state === "submitting") ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading repositories...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRepositories}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : filteredRepos.length === 0 ? (
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