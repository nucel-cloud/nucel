"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nucel.cloud/design-system/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nucel.cloud/design-system/components/ui/tabs";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { MoreHorizontal, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nucel.cloud/design-system/components/ui/dropdown-menu";

interface DataItem {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
}

interface DataTableProps {
  data: DataItem[];
}

export function DataTable({ data }: DataTableProps) {
  const [selectedTab, setSelectedTab] = useState("outline");

  const pastPerformanceData = data.filter((item) => 
    item.header.toLowerCase().includes("past") || 
    item.header.toLowerCase().includes("performance")
  );

  const keyPersonnelData = data.filter((item) => 
    item.reviewer && item.reviewer !== "Assign reviewer"
  ).slice(0, 2);

  const focusDocumentsData = data.filter((item) =>
    item.type === "Technical content" || item.type === "Research"
  );

  const getTabData = () => {
    switch (selectedTab) {
      case "performance":
        return pastPerformanceData;
      case "personnel":
        return keyPersonnelData;
      case "focus":
        return focusDocumentsData;
      default:
        return data;
    }
  };

  const currentData = getTabData();

  return (
    <div className="px-4 lg:px-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="performance">
            Past Performance
            <Badge variant="secondary" className="ml-2">
              {pastPerformanceData.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="personnel">
            Key Personnel
            <Badge variant="secondary" className="ml-2">
              {keyPersonnelData.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="focus">Focus Documents</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Header</TableHead>
                  <TableHead>Section Type</TableHead>
                  <TableHead className="text-center">Target</TableHead>
                  <TableHead className="text-center">Limit</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="font-medium">{item.header}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{item.type}</span>
                    </TableCell>
                    <TableCell className="text-center">{item.target}</TableCell>
                    <TableCell className="text-center">{item.limit}</TableCell>
                    <TableCell>{item.reviewer}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}