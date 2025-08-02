import {useEffect} from "react";
import {useElementsStore} from "@/stores/elementsStore.ts";
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import {
  faCircleChevronDown,
  faCircleChevronUp,
  faCircleMinus,
} from '@fortawesome/free-solid-svg-icons'
import { useTableOrderStore } from '@/stores/tableOrderStore';
import {OrdAsc, OrdBy, OrdItm, sort_items} from "@/components/ordering.ts";
import ProcessTableListView from "@/components/ProcessTableListView.tsx";
import {useTableStore} from "@/stores/tableStore.ts";
import {ProcessInfo} from "@/bindings.ts";
import {useProcessesStore} from "@/stores/processesStore.ts";

function ProcessTableView() {
  // const setElements = useElementsStore((state) => state.setElements);
  const processes = useProcessesStore((state) => state.processes);

  const table = useTableStore((state) => state.table);
  const setTable = useTableStore((state) => state.setTable);
  const tableOrder = useTableOrderStore((state) => state.tableOrder);
  const setTableOrder = useTableOrderStore((state) => state.setTableOrder);

  const clickOrder = (nm: OrdBy): void => {
    let asc: OrdAsc = 'Asc'
    if (tableOrder.nm == nm) {
      asc = tableOrder.asc == 'Asc' ? 'Desc' : 'Asc'
    }
    setTableOrder({
      nm,
      asc
    })
  }

  useEffect(() => {
    if (processes == undefined) return;
    let ordering: OrdItm[] = [
      tableOrder,
      { nm: "Ppid", asc: 'Asc' },
      { nm: "Pid", asc: 'Asc' },
      { nm: "Name", asc: 'Asc' },
    ]
    const sorted_items = sort_items(processes, ordering);
    setTable([...sorted_items]);
    setTable(processes);
    // if (tableOrder) {
    //   setTableOrder({
    //     ...tableOrder,
    //   })
    // } else {
    //   setTableOrder({
    //     nm: 'Name',
    //     asc: 'Asc'
    //   })
    // }
  }, [processes]);

  useEffect(() => {
    if (table == undefined || processes == undefined) return;
    let ordering: OrdItm[] = [
      tableOrder,
      { nm: "Ppid", asc: 'Asc' },
      { nm: "Pid", asc: 'Asc' },
      { nm: "Name", asc: 'Asc' },
    ]
    const sorted_items = sort_items(processes, ordering);
    setTable([...sorted_items]);
  }, [tableOrder]);


  let iconPid = faCircleMinus
  let iconPpid = faCircleMinus
  let iconName = faCircleMinus
  let iconAddr = faCircleMinus
  let iconPort = faCircleMinus
  let iconMemory = faCircleMinus
  let iconUptime = faCircleMinus

  if (tableOrder.nm == 'Pid') {
    iconPid = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  } else if (tableOrder.nm == 'Ppid') {
    iconPpid = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  } else if (tableOrder.nm == 'Name') {
    iconName = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  } else if (tableOrder.nm == 'Addr') {
    iconAddr = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  } else if (tableOrder.nm == 'Port') {
    iconPort = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  } else if (tableOrder.nm == 'Memory') {
    iconMemory = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  } else if (tableOrder.nm == 'Uptime') {
    iconUptime = tableOrder.asc == 'Asc' ? faCircleChevronUp : faCircleChevronDown
  }

  return (
    <div className="table-pane">
      <div className="header">
        <div className="col ppid"><Icon icon={iconPpid} onClick={() => clickOrder('Ppid')} />ppid</div>
        <div className="col pid"><Icon icon={iconPid} onClick={() => clickOrder('Pid')} />pid</div>
        <div className="col name"><Icon icon={iconName} onClick={() => clickOrder('Name')} />name</div>
        <div className="col addr"><Icon icon={iconAddr} onClick={() => clickOrder('Addr')} />addr</div>
        <div className="col port"><Icon icon={iconPort} onClick={() => clickOrder('Port')} />port</div>
        <div className="col memory"><Icon icon={iconMemory} onClick={() => clickOrder('Memory')} />memory</div>
        <div className="col uptime"><Icon icon={iconUptime} onClick={() => clickOrder('Uptime')} />uptime</div>
      </div>
      <ProcessTableListView />
    </div>
  )
}

export default ProcessTableView;
