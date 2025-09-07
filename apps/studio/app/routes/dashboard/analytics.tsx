import { SiteHeader } from "~/components/site-header";
import { ChartWrapper } from "~/components/chart-wrapper";

export default function Analytics() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="text-muted-foreground">
                  Track your application performance and user engagement.
                </p>
              </div>
              <ChartWrapper />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}