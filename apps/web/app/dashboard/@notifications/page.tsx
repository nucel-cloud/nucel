"use client";

import { useState, useEffect } from "react";

type Notification = {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching notifications
    const timer = setTimeout(() => {
      setNotifications([
        {
          id: 1,
          title: "New user registered",
          description: "John Doe just signed up",
          time: "5m ago",
          read: false,
        },
        {
          id: 2,
          title: "Payment received",
          description: "$299 from Acme Corp",
          time: "1h ago",
          read: false,
        },
        {
          id: 3,
          title: "New comment",
          description: "On your blog post",
          time: "2h ago",
          read: true,
        },
      ]);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border p-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Notifications</h3>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              notification.read ? "bg-background" : "bg-accent"
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <span className="text-xs text-muted-foreground">{notification.time}</span>
            </div>
            <p className="text-sm text-muted-foreground">{notification.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}