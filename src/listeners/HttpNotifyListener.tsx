import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {HttpNotify} from "@/bindings";
import {useElementsStore} from "@/stores/elementsStore.ts";
import {makeElements} from "@/components/ProcessGraphView.tsx";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";

function HttpNotifyListener() {
  const setElements = useElementsStore((state) => state.setElements);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);

  useEffect(() => {
    const unlisten = listen<HttpNotify>('http', (event) => {
      let taskNotify = event.payload;
      if (taskNotify.cmd === "Refresh") {
        setSelectedPid(undefined);
        setElements(undefined);
        makeElements().then((elements) => {
          setElements(elements);
        })
      }
    });
    return () => {
      unlisten.then((f) => f());
    };

  }, [])
  return null;
}

export default HttpNotifyListener;