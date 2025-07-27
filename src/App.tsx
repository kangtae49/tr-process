import {useEffect, useState} from "react";
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import {RouterProvider, createBrowserRouter} from "react-router-dom";
import "./App.css";
import AppLayout from "@/routes/AppLayout.tsx";
import ErrorView from "@/routes/ErrorView.tsx";
import ProcessView from "@/routes/ProcessView.tsx";
import {commands} from "@/bindings.ts";
import {useResourcePathStore} from "@/stores/resourcePathStore.ts";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorView />,
    children: [
      {
        index: true,
        element: <ProcessView />,
      },
      {
        path: '/process',
        element: <ProcessView />,
      },
    ]
  },
]);


function App() {
  const resourcePath = useResourcePathStore((state) => state.resourcePath);
  const setResourcePath = useResourcePathStore((state) => state.setResourcePath);
  useEffect(() => {
    commands.getResourcePath().then(res => {
      if (res.status === "ok") {
        setResourcePath(res.data);
      }
    });

  }, [])

  useEffect(() => {
    if (resourcePath === undefined) return;

    commands.runHttpServer({
      name: "tr-process",
      ip: "127.0.0.1",
      port: 0,
      path: resourcePath
    }).then(
      (res) => {
        if (res.status == 'error') {
          console.log('The server is already running.')
        }
      },
      (_err) => console.log('The server is already running.')
    )
  }, [resourcePath]);

  return (
    <main className="container">
      <RouterProvider router={router} />
    </main>
  );
}

export default App;
