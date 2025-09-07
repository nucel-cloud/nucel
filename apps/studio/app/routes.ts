import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("analytics", "routes/dashboard/analytics.tsx"),
    route("projects", "routes/dashboard/projects.tsx"),
    route("deployments", "routes/dashboard/deployments.tsx"),
    route("team", "routes/dashboard/team.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;
