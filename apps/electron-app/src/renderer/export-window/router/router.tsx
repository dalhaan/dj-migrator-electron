import { createHashRouter } from "react-router-dom";

import { ExportScreen } from "./routes/export-screen";

import { App } from "@/app";

export const router = createHashRouter([
  {
    element: <App />,
    children: [
      // Public routes
      {
        path: "/",
        element: <ExportScreen />,
      },
    ],
  },
]);
