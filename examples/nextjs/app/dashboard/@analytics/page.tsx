import { Suspense } from "react";

async function getAnalyticsData() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    chart: [
      { name: "Jan", value: 400 },
      { name: "Feb", value: 300 },
      { name: "Mar", value: 600 },
      { name: "Apr", value: 800 },
      { name: "May", value: 500 },
      { name: "Jun", value: 900 },
    ],
  };
}

function AnalyticsSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
      <div className="h-64 bg-muted animate-pulse rounded" />
    </div>
  );
}

async function AnalyticsChart() {
  const data = await getAnalyticsData();
  
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Analytics</h3>
      <div className="h-64 flex items-end justify-between gap-2">
        {data.chart.map((item) => (
          <div key={item.name} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
              style={{ height: `${(item.value / 900) * 100}%` }}
            />
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsChart />
    </Suspense>
  );
}