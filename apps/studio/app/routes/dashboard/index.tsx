import type { Route } from "./+types/index";
import { DataTable } from "~/components/data-table";
import { SectionCards } from "~/components/section-cards";
import { SiteHeader } from "~/components/site-header";
import dataJson from "~/data.json";

export async function loader({ request }: Route.LoaderArgs) {
  return { data: dataJson };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </>
  );
}