import { redirect } from "react-router";
import { Form, useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireUser } from "~/lib/sessions.server";
import { authClient } from "~/lib/auth-client";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nucel.cloud/design-system/components/ui/card";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@nucel.cloud/design-system/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nucel.cloud/design-system/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@nucel.cloud/design-system/components/ui/tabs";
import {
  Shield,
  Key,
  Monitor,
  Settings,
  LogOut,
  User,
  Lock,
  Smartphone,
} from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Shield className="h-6 w-6" />
              <span className="font-bold">Nucel Studio</span>
            </a>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name || user.email}
                    />
                    <AvatarFallback>
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your account settings and security preferences
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            {(user as any).role === "admin" && (
              <TabsTrigger value="admin">Admin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Account Status
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                  <p className="text-xs text-muted-foreground">
                    Email {user.emailVerified ? "verified" : "not verified"}
                  </p>
                  {!user.emailVerified && (
                    <Button variant="link" className="px-0 mt-2" size="sm">
                      Verify email
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Account Type
                  </CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {(user as any).role || "User"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full access to studio features
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Security Level
                  </CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(user as any).twoFactorEnabled ? "High" : "Standard"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(user as any).twoFactorEnabled
                      ? "2FA enabled"
                      : "2FA not enabled"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your personal details and account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </p>
                    <p className="text-sm">{user.name || "Not set"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Account ID
                    </p>
                    <p className="text-sm font-mono">{user.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Member Since
                    </p>
                    <p className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your security preferences and authentication methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">
                      Two-Factor Authentication
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Button
                    variant={
                      (user as any).twoFactorEnabled ? "secondary" : "default"
                    }
                    size="sm"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    {(user as any).twoFactorEnabled
                      ? "Manage 2FA"
                      : "Enable 2FA"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Password</div>
                    <div className="text-sm text-muted-foreground">
                      Last changed 30 days ago
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Passkeys</div>
                    <div className="text-sm text-muted-foreground">
                      Use biometric authentication for faster sign-in
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Add Passkey
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Manage your linked social accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.84 9.49.5.09.68-.22.68-.48 0-.23-.01-.84-.01-1.65-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.58 9.58 0 0112 6.8c.85 0 1.7.11 2.5.33 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.39.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10.02 10.02 0 0022 12c0-5.523-4.477-10-10-10z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">GitHub</p>
                      <p className="text-xs text-muted-foreground">
                        Not connected
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Google</p>
                      <p className="text-xs text-muted-foreground">
                        Not connected
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage and monitor your active sessions across devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-muted-foreground">
                          Active now · This device
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Current</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  View All Sessions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {(user as any).role === "admin" && (
            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Panel</CardTitle>
                  <CardDescription>
                    Administrative tools and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Administrator Access
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You have full administrative privileges. Use these
                          tools responsibly.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm">Manage Users</Button>
                          <Button size="sm" variant="outline">
                            System Settings
                          </Button>
                          <Button size="sm" variant="outline">
                            View Logs
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
