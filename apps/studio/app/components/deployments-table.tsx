"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nucel.cloud/design-system/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nucel.cloud/design-system/components/ui/card";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nucel.cloud/design-system/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Copy, RotateCcw, Trash2 } from "lucide-react";

interface Deployment {
  id: string;
  project: string;
  environment: "production" | "preview" | "development";
  status: "ready" | "building" | "error" | "cancelled";
  url: string;
  commit: string;
  author: string;
  duration: string;
  createdAt: Date;
}

const mockDeployments: Deployment[] = [
  {
    id: "dep_1",
    project: "marketing-site",
    environment: "production",
    status: "ready",
    url: "marketing.nucel.app",
    commit: "Update hero section",
    author: "John Doe",
    duration: "42s",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "dep_2",
    project: "api-service",
    environment: "preview",
    status: "building",
    url: "api-pr-123.nucel.app",
    commit: "Add rate limiting",
    author: "Jane Smith",
    duration: "1m 23s",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "dep_3",
    project: "dashboard",
    environment: "production",
    status: "ready",
    url: "dashboard.nucel.app",
    commit: "Fix navigation bug",
    author: "Bob Wilson",
    duration: "58s",
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: "dep_4",
    project: "docs",
    environment: "development",
    status: "error",
    url: "docs-dev.nucel.app",
    commit: "Update API documentation",
    author: "Alice Brown",
    duration: "2m 10s",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "dep_5",
    project: "blog",
    environment: "preview",
    status: "ready",
    url: "blog-pr-456.nucel.app",
    commit: "Add new blog post",
    author: "Charlie Davis",
    duration: "35s",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: "dep_6",
    project: "e-commerce",
    environment: "production",
    status: "cancelled",
    url: "shop.nucel.app",
    commit: "Update product catalog",
    author: "Eve Martinez",
    duration: "0s",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
];

function getStatusColor(status: Deployment["status"]) {
  switch (status) {
    case "ready":
      return "default";
    case "building":
      return "secondary";
    case "error":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "default";
  }
}

function getEnvironmentColor(env: Deployment["environment"]) {
  switch (env) {
    case "production":
      return "default";
    case "preview":
      return "secondary";
    case "development":
      return "outline";
    default:
      return "outline";
  }
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DeploymentsTable() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Deployments</CardTitle>
        <CardDescription>
          Your latest deployments across all projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Commit</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDeployments.map((deployment) => (
              <TableRow key={deployment.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{deployment.project}</span>
                    <span className="text-xs text-muted-foreground">
                      {deployment.url}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getEnvironmentColor(deployment.environment)}>
                    {deployment.environment}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(deployment.status)}>
                    {deployment.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {deployment.commit}
                </TableCell>
                <TableCell>{deployment.author}</TableCell>
                <TableCell>{deployment.duration}</TableCell>
                <TableCell>{formatTimeAgo(deployment.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Redeploy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}