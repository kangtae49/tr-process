import {Outlet} from "react-router-dom";
import HttpNotifyListener from "@/listeners/HttpNotifyListener.tsx";

function AppLayout () {
  return (
    <>
      <HttpNotifyListener />
      <Outlet />
    </>
  )
}

export default AppLayout