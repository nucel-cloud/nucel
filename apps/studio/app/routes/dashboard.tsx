import { useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireUser } from "~/lib/sessions.server";
import { AppSidebar } from "~/components/app-sidebar";
import { ChartWrapper } from "~/components/chart-wrapper";
import { DataTable } from "~/components/data-table";
import { SectionCards } from "~/components/section-cards";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "@nucel.cloud/design-system/components/ui/sidebar";
import dataJson from "~/data.json";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user, data: dataJson };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, data } = loaderData;

  return (
    <SidebarProvider>
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartWrapper />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}