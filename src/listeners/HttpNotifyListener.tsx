import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {commands, HttpNotify} from "@/bindings";
import {useProcessesStore} from "@/stores/processesStore.ts";
import {useSocketsStore} from "@/stores/socketsStore.ts";
import {useElementsStore} from "@/stores/elementsStore.ts";
import {useTreeStore} from "@/stores/treeStore.ts";

function HttpNotifyListener() {
  const setProcesses = useProcessesStore((state) => state.setProcesses);
  const setSockets = useSocketsStore((state) => state.setSockets);
  const setElements = useElementsStore((state) => state.setElements);
  const setTree = useTreeStore((state) => state.setTree);

  useEffect(() => {
    const unlisten = listen<HttpNotify>('http', (event) => {
      let taskNotify = event.payload;
      if (taskNotify.cmd === "Refresh") {
        // setTree(undefined);
        setElements(undefined);
        // setProcesses(undefined);
        // setSockets(undefined);

        commands.getProcesses().then((res) => {
          if (res.status == 'ok') {
            const processes = res.data;
            setProcesses(processes);
            console.log(taskNotify);
          }
        });

        commands.getSockets().then((res) => {
          if (res.status == 'ok') {
            const sockets = res.data;
            console.log('sockets', sockets);
            setSockets(sockets);
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