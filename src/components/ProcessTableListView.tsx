import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import { useTableStore } from '@/stores/tableStore';
import {get_mem} from "@/components/utils.ts";
import {useEffect, useRef} from "react";
import {ProcessInfo} from "@/bindings.ts";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";


const ITEM_SIZE = 18;
function ProcessTableListView() {
  const table = useTableStore((state) => state.table);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const listRef = useRef<List>(null);

  const clickItem = (pid: number | undefined | null) => {
    if (pid) {
      setSelectedPid(pid);
    }
  }

  useEffect(() => {
    console.log('table selected');
    if (selectedPid == undefined || !listRef.current) return;
    const idx = table?.findIndex((item) => item.pid == selectedPid);
    console.log('tree selected', idx);
    if (idx == undefined) {
      return
    }
    listRef.current.scrollToItem(idx, "center");
  }, [selectedPid]);

  if (table === undefined) return null;

  return (
    <div className="table">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="table-list"
            height={height}
            itemCount={table?.length}
            itemSize={ITEM_SIZE}
            width={width}
            ref={listRef}
          >
            {({ index, style }) => {
              const item: ProcessInfo = table[index];
              return item ? (
                <div className="row" key={index} style={{...style, backgroundColor: `${selectedPid == item.pid ? '#bfd2e3': null}`}} >
                  <div className="col ppid" onClick={() => clickItem(item.ppid)}>{item.ppid || ''}</div>
                  <div className="col pid" onClick={() => clickItem(item.pid)}>{item.pid}</div>
                  <div className="col name" title={getTitle(item)} onClick={() => clickItem(item.pid)}>{item.name || ''}</div>
                  <div className="col addr" onClick={() => clickItem(item.pid)}>{item.local_addr || ''}</div>
                  <div className="col port" onClick={() => clickItem(item.pid)}>{item.local_port || ''}</div>
                  <div className="col memory" onClick={() => clickItem(item.pid)}>{get_mem(item.memory) || ''}</div>
                </div>
              ) : null
            }}
          </List>
        )}
      </AutoSizer>
    </div>
  )
}

export default ProcessTableListView;

function getTitle(item: ProcessInfo): string {
  return item.exe || item.name || String(item.pid);
}
