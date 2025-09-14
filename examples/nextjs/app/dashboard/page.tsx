import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal dashboard",
};

async function getOverviewData() {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    totalRevenue: "$45,231.89",
    subscriptions: "+2350",
    sales: "+12,234",
    activeNow: "+573",
  };
}

export default async function DashboardPage() {
  const data = await getOverviewData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{data.totalRevenue}</p>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Subscriptions</p>
            <p className="text-2xl font-bold">{data.subscriptions}</p>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Sales</p>
            <p className="text-2xl font-bold">{data.sales}</p>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Active Now</p>
            <p className="text-2xl font-bold">{data.activeNow}</p>
            <p className="text-xs text-muted-foreground">+201 since last hour</p>
          </div>
        </div>
      </div>
    </div>
  );
}