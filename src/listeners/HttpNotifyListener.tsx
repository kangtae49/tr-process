import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {commands, HttpNotify} from "@/bindings";
import {useProcessesStore} from "@/stores/processesStore.ts";

function HttpNotifyListener() {
  const setProcesses = useProcessesStore((state) => state.setProcesses);

  useEffect(() => {
    const unlisten = listen<HttpNotify>('http', (event) => {
      let taskNotify = event.payload;
      if (taskNotify.cmd === "Refresh") {

        commands.getProcesses().then((res) => {
          if (res.status == 'ok') {
            const processes = res.data;
            setProcesses(processes);
            console.log(taskNotify);
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