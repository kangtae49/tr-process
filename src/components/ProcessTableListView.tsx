import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import { useTableStore } from '@/stores/tableStore';
import {get_mem} from "@/components/utils.ts";
import {useRef} from "react";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";

function ProcessTableListView() {
  const table = useTableStore((state) => state.table);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const listRef = useRef<List>(null);

  const clickPid = (pid: string | undefined) => {
    console.log(pid);
    if (pid) {
      setSelectedPid(pid);
    }
  }

  if (table === undefined) return null;

  return (
    <div className="table">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="folder-tree"
            height={height}
            itemCount={table?.length}
            itemSize={18}
            width={width}
            ref={listRef}
          >
            {({ index, style }) => {
              const item = table[index];
              return item ? (
                <div className="row" key={index} style={{...style, backgroundColor: `${selectedPid == item.data.id ? '#f4a261': null}`}} onClick={() => clickPid(item.data.id)}>
                  <div className="col pid">{item.data.id}</div>
                  <div className="col ppid">{item.data.process?.parent || ''}</div>
                  <div className="col name">{item.data.process?.name || ''}</div>
                  <div className="col addr">{item.data.socket?.local_addr || ''}</div>
                  <div className="col port">{item.data.socket?.local_port || ''}</div>
                  <div className="col memory">{get_mem(item.data.process?.memory) || ''}</div>
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
