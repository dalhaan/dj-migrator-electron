import { createHashRouter } from "react-router-dom";

import { ImportScreen } from "./routes/import-screen";

import { App } from "@/app";

export const router = createHashRouter([
  {
    element: <App />,
    children: [
      // Public routes
      {
        path: "/",
        element: <ImportScreen />,
      },
    ],
  },
]);
