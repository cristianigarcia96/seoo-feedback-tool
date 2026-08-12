import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { EditorPage } from "@/pages/EditorPage";
import { SharePage } from "@/pages/SharePage";

export const router = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },
  { path: "/editor/:pageId", element: <EditorPage /> },
  { path: "/share/:token", element: <SharePage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
