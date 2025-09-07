import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Sparkles, Rocket, Globe, GitBranch, Zap, ArrowRight } from "lucide-react";

interface CompleteStepProps {
  onGetStarted: () => void;
}

export function CompleteStep({ onGetStarted }: CompleteStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Nucel! 🎉</h2>
        <p className="text-muted-foreground text-lg">
          Your project is being deployed. Here's what happens next:
        </p>
      </div>

      <div className="space-y-3">
        <Card>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Automatic Deployments</h3>
              <p className="text-sm text-muted-foreground">
                Every push to your default branch triggers a new deployment automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Preview Deployments</h3>
              <p className="text-sm text-muted-foreground">
                Pull requests get their own preview URLs for easy testing and review.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Instant Rollbacks</h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong? Rollback to any previous deployment with one click.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Edge Performance</h3>
              <p className="text-sm text-muted-foreground">
                Your app runs on AWS Lambda@Edge for blazing-fast global performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
        <h3 className="font-semibold mb-2">Your First Deployment is Live!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Check your dashboard to see deployment progress and get your live URL.
        </p>
        <Button size="lg" onClick={onGetStarted} className="w-full sm:w-auto">
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Need help? Check out our <a href="#" className="underline">documentation</a> or <a href="#" className="underline">join our community</a>.</p>
      </div>
    </div>
  );
}