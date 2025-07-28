import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import { useTableStore } from '@/stores/tableStore';
import {get_mem} from "@/components/utils.ts";
import {useEffect, useRef} from "react";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";
import {ElementDefinition} from "cytoscape";
import {useSelectedItemStore} from "@/stores/selectedItemStore.ts";
import {Item} from "@/components/ProcessGraphView.tsx";


const ITEM_SIZE = 18;
function ProcessTableListView() {
  const table = useTableStore((state) => state.table);
  // const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  // const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const selectedItem = useSelectedItemStore((state) => state.selectedItem);
  const setSelectedItem = useSelectedItemStore((state) => state.setSelectedItem);
  const listRef = useRef<List>(null);

  // const clickPid = (pid: string | undefined) => {
  //   console.log(pid);
  //   if (pid) {
  //     setSelectedPid(pid);
  //   }
  // }
  const clickItem = (item: Item) => {
    console.log(item);
    if (item) {
      setSelectedItem(item);
    }
  }

  useEffect(() => {
    if (selectedItem == undefined || !listRef.current) return;
    const idx = table?.findIndex((item) => item.id == selectedItem.id);
    // console.log('idx', idx);
    if (idx) {
      // listRef.current.scrollTo(idx);
      listRef.current.scrollToItem(idx, "center");
    }
  }, [selectedItem]);

  if (table === undefined) return null;

  return (
    <div className="table">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="folder-tree"
            height={height}
            itemCount={table?.length}
            itemSize={ITEM_SIZE}
            width={width}
            ref={listRef}
          >
            {({ index, style }) => {
              const item = table[index];
              return item ? (
                <div className="row" key={index} style={{...style, backgroundColor: `${selectedItem?.id == item.id ? '#f4a261': null}`}} onClick={() => clickItem(item)}>
                  <div className="col pid">{item.id}</div>
                  <div className="col ppid">{item.process?.parent || ''}</div>
                  <div className="col name">{item.process?.name || ''}</div>
                  <div className="col addr">{item.socket?.local_addr || ''}</div>
                  <div className="col port">{item.socket?.local_port || ''}</div>
                  <div className="col memory">{get_mem(item.process?.memory) || ''}</div>
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
