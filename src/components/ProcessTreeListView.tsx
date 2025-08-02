import {FixedSizeList as List} from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import {useEffect, useRef, useState} from "react";
import {get_mem, get_sec} from "@/components/utils.ts";
import {CollectionReturnValue, EdgeSingular, NodeCollection, NodeSingular} from "cytoscape";
import {useCyStore} from "@/stores/cyStore.ts";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";

const ITEM_SIZE = 18;

function ProcessTreeListView() {
  const cyInstance = useCyStore((state) => state.cyInstance);
  const listRef = useRef<List>(null);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  const [rootNodes, setRootNodes] = useState<NodeCollection | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<NodeSingular | undefined>(undefined);
  const clickItem = (item: NodeSingular | undefined) => {
    console.log(item);
    setSelectedPid(item?.data('pid'));
  }

  useEffect(() => {
    console.log('tree selected');
    if (selectedPid == undefined || !cyInstance || !listRef.current) return;
    const processInfo = cyInstance.getElementById(`${selectedPid}`) as NodeSingular;
    setSelectedItem(processInfo);

    const rootNodes: NodeCollection = cyInstance.nodes().filter((node) => node.incomers('edge').empty());

    const idx = getIndexFromItem(rootNodes, cyInstance.getElementById(`${selectedPid}`));
    if (idx == undefined) {
      return;
    }
    listRef.current.scrollToItem(idx, "center");
  }, [selectedPid]);

  useEffect(() => {
    if (!cyInstance) return;
    const rootNodes: NodeCollection = cyInstance.nodes().filter((node) => node.incomers('edge').empty());

    setRootNodes(rootNodes);
    console.log('rootNodes', rootNodes);

  }, [cyInstance]);


  console.log('render tree');
  return (cyInstance && rootNodes) && (
    <div className="tree">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="tree-list"
            height={height}
            itemCount={cyInstance.nodes().length}
            itemSize={ITEM_SIZE}
            width={width}
            ref={listRef}
          >
            {({ index, style }) => {
              const [item, _idx, depth] = getItemFromIndex(rootNodes, index);
              const dep = Array.from({ length: depth }, (_, i) => i);
              return item ? (
              <div className="row-tree" key={index} style={{...style, backgroundColor: `${selectedItem?.data('pid') == String(item.data('pid')) ? '#bfd2e3': null}`}} >
                {dep.map((depIdx)=> {
                  return (
                  <div className="depth" key={depIdx} onClick={() => clickItem(getParentItem(item, (depth - depIdx)))}>
                    {getParentItem(item, (depth - depIdx))?.data('pid')}
                  </div>
                )})}
                <div className="row">
                  <div className="col pid" onClick={() => clickItem(item)}>{item.data('pid')}</div>
                  <div className="col name" title={getTitle(item)} onClick={() => clickItem(item)}>{item.data('name') || ''}</div>
                  <div className="col addr" onClick={() => clickItem(item)}>{item.data('local_addr') || ''}</div>
                  <div className="col port" onClick={() => clickItem(item)}>{item.data('local_port') || ''}</div>
                  <div className="col memory" onClick={() => clickItem(item)}>{get_mem(item.data('memory')) || ''}</div>
                  <div className="col uptime" onClick={() => clickItem(item)}>{get_sec(item.data('uptime')) || ''}</div>
                </div>
              </div>
              ) : null
            }}
          </List>
        )}
      </AutoSizer>
    </div>
  )
}

export default ProcessTreeListView;



function getItemFromIndex(rootNodes: NodeCollection, nth: number): [NodeSingular | undefined, number, number] {
  const [item, index, depth] = getItemFromNth(rootNodes, nth, -1, 0);
  return [item, index, depth];
}


function getIndexFromItem(rootList: NodeCollection | undefined, item: NodeSingular): number | undefined {
  const [findIndex] = getNthFromItem(rootList, item, -1, 0);
  return findIndex;
}


function getItemFromNth(rootNodes: NodeCollection | NodeSingular [] | undefined, nth: number, curIdx = -1, curDepth = 0): [treeItem: NodeSingular | undefined, number, number] {
  let findTreeItem: NodeSingular | undefined = undefined
  if (!rootNodes) {
    return [findTreeItem, curIdx, curDepth]
  }
  for (let idxItem = 0; idxItem < rootNodes.length; idxItem++) {
    curIdx++
    if (curIdx == nth) {
      findTreeItem = rootNodes[idxItem]
      break
    }
    const children: NodeSingular[] = rootNodes[idxItem].outgoers('edge').map((edge: EdgeSingular) => {
      return edge.target() as NodeSingular
    });

    const [findItem, nextIdx, findDepth] = getItemFromNth(children, nth, curIdx, curDepth + 1)
    findTreeItem = findItem
    curIdx = nextIdx
    if (findTreeItem) {
      curDepth = findDepth;
      break
    }
  }
  return [findTreeItem, curIdx, curDepth]
}

function getNthFromItem(treeItems: CollectionReturnValue| NodeCollection | NodeSingular[] |undefined, item: NodeSingular, curIdx = -1, curDepth = 0): [number | undefined, number, number] {
  let findIndex: number | undefined = undefined
  if (!treeItems) {
    return [findIndex, curIdx, curDepth]
  }
  for (let idxItem = 0; idxItem < treeItems.length; idxItem++) {
    curIdx++
    if (treeItems[idxItem].data('pid') == item.data('pid')) {
      findIndex = curIdx
      break
    }

    const children: NodeSingular[] = treeItems[idxItem].outgoers('edge').map((edge: EdgeSingular) => {
      return edge.target() as NodeSingular
    });

    const [findNth, nextIdx, findDepth] = getNthFromItem(children, item, curIdx, curDepth + 1)
    findIndex = findNth
    curIdx = nextIdx
    if (findIndex) {
      curDepth = findDepth;
      break
    }
  }
  return [findIndex, curIdx, curDepth]
}


function getParentItem(item: NodeSingular, nth: number): NodeSingular | undefined {
  let curItem: NodeSingular | undefined = item;
  for(let i=0; i < nth; i++) {
    let edge = curItem.incomers('edge').first() as EdgeSingular;
    if (edge.nonempty() && edge.isEdge()) {
      curItem = edge.source();
    } else {
      break;
    }
  }
  return curItem;
}

function getTitle(node: NodeSingular): string {
  return node.data('exe') || node.data('name') || String(node.data('pid'));
}

