import { Navigate, createHashRouter } from "react-router-dom";

import { Dashboard } from "./routes/dashboard";

import { App } from "@/app";

export const router = createHashRouter([
  {
    element: <App />,
    children: [
      // Public routes
      {
        path: "/",
        element: <Navigate to="/dashboard" />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
    ],
  },
]);
