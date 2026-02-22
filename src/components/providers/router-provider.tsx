import { createBrowserRouter } from "react-router";
import { RouterProvider as Provider } from "react-router/dom";
import RootLayout from "@/layouts/root-layout"; // Import your new layout
import { YoutubeDownloader } from "@/pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <YoutubeDownloader />,
      },
    ],
  },
]);

export default function RouterProvider() {
  return <Provider router={router} />;
}
