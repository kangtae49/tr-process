import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {commands, HttpNotify} from "@/bindings";
import {useElementsStore} from "@/stores/elementsStore.ts";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";
import {useProcessesStore} from "@/stores/processesStore.ts";

function HttpNotifyListener() {
  const setElements = useElementsStore((state) => state.setElements);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const setProcesses = useProcessesStore((state) => state.setProcesses);

  useEffect(() => {
    const unlisten = listen<HttpNotify>('http', (event) => {
      let taskNotify = event.payload;
      if (taskNotify.cmd === "Refresh") {
        setSelectedPid(undefined);
        setElements(undefined);

        commands.getProcess().then((res) => {
          if (res.status == 'ok') {
            const processes = res.data;
            setProcesses(processes);
          }
        });

      }
    });
    return () => {
      unlisten.then((f) => f());
    };

  }, [])
  return null;
}

export default HttpNotifyListener;