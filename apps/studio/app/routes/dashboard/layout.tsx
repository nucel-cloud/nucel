import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { requireUser } from "~/lib/sessions.server";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@nucel.cloud/design-system/components/ui/sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <SidebarProvider>
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}