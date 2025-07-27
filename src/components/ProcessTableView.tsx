import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import {useEffect, useRef, useState} from "react";
import cytoscape from 'cytoscape';
import {useElementsStore} from "@/stores/elementsStore.ts";
import {get_mem} from "@/components/utils.ts";

function ProcessTableView() {
  const listRef = useRef<List>(null);
  const elements = useElementsStore((state) => state.elements);
  const [nodes, setNodes] = useState<cytoscape.ElementDefinition[] | undefined>(undefined);

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
      <div className="search">
        search
      </div>
      <div className="header">
        columns
      </div>
      <div className="table">
        <AutoSizer>
          {({ height, width }) => (
            <List
              className="folder-tree"
              height={height}
              itemCount={nodes?.length}
              itemSize={20}
              width={width}
              ref={listRef}
            >
              {({ index, style }) => {
                const item = nodes[index];
                return item ? (
                  <div className="row" key={index} style={style} >
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
