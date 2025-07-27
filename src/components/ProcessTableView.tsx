import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import {useEffect, useRef, useState} from "react";
import cytoscape from 'cytoscape';
import {useElementsStore} from "@/stores/elementsStore.ts";
import {get_mem} from "@/components/utils.ts";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";

function ProcessTableView() {
  const listRef = useRef<List>(null);
  const elements = useElementsStore((state) => state.elements);
  const [nodes, setNodes] = useState<cytoscape.ElementDefinition[] | undefined>(undefined);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);

  const clickPid = (pid: string | undefined) => {
    console.log(pid);
    if (pid) {
      setSelectedPid(pid);
    }
  }

  useEffect(() => {
    if (elements) {
      const elems: cytoscape.ElementDefinition[] = elements.filter((elem) => elem.data.type === 'node');
      console.log(elems);
      setNodes(elems);
    }
  }, [elements]);

  if (!nodes) return null;

  return (
    <div className="table-pane">
      <div className="header">
        <div className="col pid">pid</div>
        <div className="col ppid">ppid</div>
        <div className="col name">name</div>
        <div className="col addr">addr</div>
        <div className="col port">port</div>
        <div className="col memory">memory</div>

      </div>
      <div className="table">
        <AutoSizer>
          {({ height, width }) => (
            <List
              className="folder-tree"
              height={height}
              itemCount={nodes?.length}
              itemSize={18}
              width={width}
              ref={listRef}
            >
              {({ index, style }) => {
                const item = nodes[index];
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
    </div>
  )
}

export default ProcessTableView;
