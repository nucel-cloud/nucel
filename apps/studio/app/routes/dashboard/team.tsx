import { SiteHeader } from "~/components/site-header";

export default function Team() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Team</h1>
                <p className="text-muted-foreground">
                  Manage team members and permissions.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Team management page coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}