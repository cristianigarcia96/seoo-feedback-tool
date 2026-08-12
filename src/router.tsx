import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { EditorPage } from "@/pages/EditorPage";
import { SharePage } from "@/pages/SharePage";
import { LoginPage } from "@/pages/LoginPage";
import { RequireAuth } from "@/components/RequireAuth";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DashboardPage />
      </RequireAuth>
    ),
  },
  {
    path: "/editor/:pageId",
    element: (
      <RequireAuth>
        <EditorPage />
      </RequireAuth>
    ),
  },
  // The client share view is intentionally public — no auth.
  { path: "/share/:token", element: <SharePage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
