import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Card, CardContent } from "@nucel.cloud/design-system/components/ui/card";
import { Input } from "@nucel.cloud/design-system/components/ui/input";
import { Label } from "@nucel.cloud/design-system/components/ui/label";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { Alert, AlertDescription } from "@nucel.cloud/design-system/components/ui/alert";
import { CheckCircle2, Cloud, ExternalLink, Copy, AlertCircle, RefreshCw } from "lucide-react";

interface AWSAccount {
  id: string;
  accountId: string;
  accountAlias?: string | null;
  region: string;
  stackStatus?: string | null;
  verifiedAt?: Date | null;
}

interface AWSStepProps {
  accounts: AWSAccount[];
  onComplete: () => void;
}

export function AWSStep({ accounts, onComplete }: AWSStepProps) {
  const fetcher = useFetcher();
  const [externalId, setExternalId] = useState<string>("");
  const [cloudFormationUrl, setCloudFormationUrl] = useState<string>("");
  const [roleArn, setRoleArn] = useState("");
  const [accountId, setAccountId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Generate external ID and CloudFormation URL on mount
  useEffect(() => {
    // Use server action to generate the CloudFormation URL
    const formData = new FormData();
    formData.append("actionType", "generate-aws-url");
    formData.append("region", "us-east-1");
    fetcher.submit(formData, { method: "post" });
  }, []);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if ('externalId' in fetcher.data && 'cloudFormationUrl' in fetcher.data) {
        // Response from generate-aws-url action
        setExternalId(fetcher.data.externalId);
        setCloudFormationUrl(fetcher.data.cloudFormationUrl);
      } else if ('success' in fetcher.data && fetcher.data.success) {
        // Response from aws-connect action - account saved successfully
        setVerifying(false);
        onComplete();
      }
    }
  }, [fetcher.data, onComplete]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLaunchStack = () => {
    window.open(cloudFormationUrl, "_blank");
  };

  const handleVerifyAndContinue = () => {
    if (!roleArn || !accountId || !externalId) {
      alert("Please enter both Role ARN and Account ID");
      return;
    }

    setVerifying(true);
    
    // Submit to server action to save AWS account
    const formData = new FormData();
    formData.append("actionType", "aws-connect");
    formData.append("accountId", accountId);
    formData.append("roleArn", roleArn);
    formData.append("externalId", externalId);
    formData.append("region", "us-east-1");
    formData.append("accountAlias", `AWS Account ${accountId}`);
    
    fetcher.submit(formData, { method: "post" });
  };

  if (accounts.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">AWS Account Connected</h2>
          <p className="text-muted-foreground">
            Your AWS account is connected and ready for deployments.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Connected Accounts</h3>
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Cloud className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {account.accountAlias || `AWS Account ${account.accountId}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {account.accountId} · {account.region}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.verifiedAt && (
                    <Badge variant="secondary" className="text-green-600">
                      Verified
                    </Badge>
                  )}
                  {account.stackStatus === "CREATE_COMPLETE" && (
                    <Badge variant="outline">Stack Ready</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={onComplete}>
            Continue to Repository Selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <Cloud className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Connect Your AWS Account</h2>
        <p className="text-muted-foreground">
          Deploy a CloudFormation stack to grant Nucel access to your AWS resources.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This will create an IAM role with permissions to manage Lambda, API Gateway, S3, CloudFront, and related services.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-3">Step 1: Deploy CloudFormation Stack</h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <Label htmlFor="external-id" className="text-sm">External ID (for security)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="external-id"
                  value={externalId}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(externalId, "external-id")}
                >
                  {copied === "external-id" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleLaunchStack}
            >
              <Cloud className="w-4 h-4 mr-2" />
              Launch CloudFormation Stack
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              This will open AWS Console in a new tab. Deploy the stack and copy the outputs.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Step 2: Enter Stack Outputs</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="role-arn">Role ARN</Label>
              <Input
                id="role-arn"
                placeholder="arn:aws:iam::123456789012:role/nucel-deployment-role"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find this in the CloudFormation stack outputs
              </p>
            </div>

            <div>
              <Label htmlFor="account-id">AWS Account ID</Label>
              <Input
                id="account-id"
                placeholder="123456789012"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your 12-digit AWS account number
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Back
        </Button>
        <Button
          onClick={handleVerifyAndContinue}
          disabled={!roleArn || !accountId || verifying}
        >
          {verifying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying Access...
            </>
          ) : (
            "Verify & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}