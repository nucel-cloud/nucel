import { SiteHeader } from "~/components/site-header";

export default function Settings() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-muted-foreground">
                  Configure your application settings and preferences.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Settings page coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}