import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import { useTableStore } from '@/stores/tableStore';
import {get_mem} from "@/components/utils.ts";
import {useEffect, useRef} from "react";
import {useSelectedItemStore} from "@/stores/selectedItemStore.ts";
import {Item} from "@/components/ProcessGraphView.tsx";


const ITEM_SIZE = 18;
function ProcessTableListView() {
  const table = useTableStore((state) => state.table);
  const selectedItem = useSelectedItemStore((state) => state.selectedItem);
  const setSelectedItem = useSelectedItemStore((state) => state.setSelectedItem);
  const listRef = useRef<List>(null);

  const clickItem = (item: Item | undefined) => {
    console.log(item);
    setSelectedItem(item);
  }

  useEffect(() => {
    console.log('table selected');
    if (selectedItem == undefined || !listRef.current) return;
    const idx = table?.findIndex((item) => item.id == selectedItem.id);
    console.log('tree selected', idx);
    if (idx) {
      listRef.current.scrollToItem(idx, "center");
    }
  }, [selectedItem]);

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
              const item = table[index];
              return item ? (
                <div className="row" key={index} style={{...style, backgroundColor: `${selectedItem?.id == item.id ? '#bfd2e3': null}`}} >
                  <div className="col ppid" onClick={() => clickItem(item.parent)}>{item.process?.parent || ''}</div>
                  <div className="col pid" onClick={() => clickItem(item)}>{item.id}</div>
                  <div className="col name" title={getTitle(item)} onClick={() => clickItem(item)}>{item.process?.name || ''}</div>
                  <div className="col addr" onClick={() => clickItem(item)}>{item.socket?.local_addr || ''}</div>
                  <div className="col port" onClick={() => clickItem(item)}>{item.socket?.local_port || ''}</div>
                  <div className="col memory" onClick={() => clickItem(item)}>{get_mem(item.process?.memory) || ''}</div>
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

function getTitle(item: Item): string {
  return item.process.exe || item.process.name || item.id;
}
