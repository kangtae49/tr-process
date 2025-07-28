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
import {useSelectedItemStore} from "@/stores/selectedItemStore.ts";
import {Item} from "@/components/ProcessGraphView.tsx";

function ProcessTableView() {
  const elements = useElementsStore((state) => state.elements);
  const tableOrder = useTableOrderStore((state) => state.tableOrder);
  const table = useTableStore((state) => state.table);
  const setTable = useTableStore((state) => state.setTable);
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
    if (elements) {
      const elems: Item[] = elements
        .filter((elem) => elem.data.type === 'node')
        .map((elem) => elem.data as Item)
      ;
      setTable(elems);
      if (tableOrder) {
        setTableOrder({
          ...tableOrder,
        })
      } else {
        setTableOrder({
          nm: 'Name',
          asc: 'Asc'
        })
      }
    }
  }, [elements]);

  useEffect(() => {
    if (!table) return;
    let ordering: OrdItm[] = [tableOrder];
    if (tableOrder.nm == 'Name') {
      ordering = [
        tableOrder,
        { nm: "Pid", asc: 'Asc' },
      ]
    } else {
      ordering = [
        tableOrder,
        { nm: "Name", asc: 'Asc' },
      ]
    }
    const sorted_items = sort_items(table, ordering);
    setTable([...sorted_items]);
  }, [tableOrder]);



  let iconPid = faCircleMinus
  let iconPpid = faCircleMinus
  let iconName = faCircleMinus
  let iconAddr = faCircleMinus
  let iconPort = faCircleMinus
  let iconMemory = faCircleMinus

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
  }

  return (
    <div className="table-pane">
      <div className="header">
        <div className="col pid"><Icon icon={iconPid} onClick={() => clickOrder('Pid')} />pid</div>
        <div className="col ppid"><Icon icon={iconPpid} onClick={() => clickOrder('Ppid')} />ppid</div>
        <div className="col name"><Icon icon={iconName} onClick={() => clickOrder('Name')} />name</div>
        <div className="col addr"><Icon icon={iconAddr} onClick={() => clickOrder('Addr')} />addr</div>
        <div className="col port"><Icon icon={iconPort} onClick={() => clickOrder('Port')} />port</div>
        <div className="col memory"><Icon icon={iconMemory} onClick={() => clickOrder('Memory')} />memory</div>
      </div>
      <ProcessTableListView />
    </div>
  )
}

export default ProcessTableView;
