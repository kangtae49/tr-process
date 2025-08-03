import {FixedSizeList as List} from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import {useEffect, useRef, useState} from "react";
import {get_mem, get_sec} from "@/components/utils.ts";
import {EdgeSingular, NodeSingular} from "cytoscape";
import {useCyStore} from "@/stores/cyStore.ts";
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";
import natsort from "natsort";
import {OrdItm} from "@/components/ordering.ts";
import {useTableOrderStore} from "@/stores/tableOrderStore.ts";

const ITEM_SIZE = 18;

function ProcessTreeListView() {
  const cyInstance = useCyStore((state) => state.cyInstance);
  const listRef = useRef<List>(null);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  const [rootNodes, setRootNodes] = useState<NodeSingular[] | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<NodeSingular | undefined>(undefined);
  const tableOrder = useTableOrderStore((state) => state.tableOrder);
  const [treeOrder, setTreeOrder] = useState<OrdItm[] | undefined>([])

  const clickItem = (item: NodeSingular | undefined) => {
    setSelectedPid(item?.data('pid'));
  }

  useEffect(() => {
    let ordering: OrdItm[] = [
      tableOrder,
      { nm: "Ppid", asc: 'Asc' },
      { nm: "Pid", asc: 'Asc' },
      { nm: "Name", asc: 'Asc' },
    ]
    setTreeOrder(ordering);
  }, [tableOrder]);

  useEffect(() => {
    if (!cyInstance || !listRef.current || !treeOrder) return;
    const processInfo = cyInstance.getElementById(`${selectedPid}`) as NodeSingular;
    setSelectedItem(processInfo);

    const idx = getIndexFromItem(rootNodes, cyInstance.getElementById(`${selectedPid}`));
    if (idx == undefined) {
      return;
    }
    listRef.current.scrollToItem(idx, "center");
  }, [selectedPid]);

  useEffect(() => {
    if (!cyInstance) return;
    let rootNodes: NodeSingular[] | undefined = cyInstance.nodes().filter((node) => node.incomers('edge').empty())
      .map((node) => node as NodeSingular);

    rootNodes = sort_tree(rootNodes);

    setRootNodes(rootNodes);

  }, [cyInstance]);

  return (cyInstance && rootNodes && treeOrder ) && (
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



function getItemFromIndex(rootNodes: NodeSingular [], nth: number): [NodeSingular | undefined, number, number] {
  const [item, index, depth] = getItemFromNth(rootNodes, nth, -1, 0);
  return [item, index, depth];
}


function getIndexFromItem(rootList: NodeSingular [] | undefined, item: NodeSingular): number | undefined {
  const [findIndex] = getNthFromItem(rootList, item, -1, 0);
  return findIndex;
}


function getItemFromNth(rootNodes: NodeSingular [] | undefined, nth: number, curIdx = -1, curDepth = 0): [treeItem: NodeSingular | undefined, number, number] {
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

function getNthFromItem(treeItems: NodeSingular[] |undefined, item: NodeSingular, curIdx = -1, curDepth = 0): [number | undefined, number, number] {
  let findIndex: number | undefined = undefined
  if (treeItems == undefined) {
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

function sort_tree(items: NodeSingular[] | undefined) {
  let ordering: OrdItm[] = [
    { nm: "Pid", asc: 'Asc' },
    { nm: "Name", asc: 'Asc' },
  ]
  return sort_items(items, ordering);
}

function sort_items(items: NodeSingular[] | undefined, ordItms: OrdItm[]) {
  if (items == undefined) {
    return items;
  }
  const sorters = ordItms.map(ordItm => ({
    key: ordItm.nm,
    sorter: natsort({
      insensitive: true,
      desc: ordItm.asc === 'Desc',
    }),
  }));

  return items.sort((a, b) => {
    for (const { key, sorter }of sorters) {
      let valA = '';
      let valB = '';
      if (key === 'Pid') {
        valA = a.data('pid')?.toString() ?? '';
        valB = b.data('pid')?.toString() ?? '';
      } else if (key === 'Ppid') {
        valA = a.data('ppid')?.toString() ?? '';
        valB = b.data('ppid')?.toString() ?? '';
      } else if (key === 'Name') {
        valA = a.data('name')?.toString() ?? '';
        valB = b.data('name')?.toString() ?? '';
      } else if (key === 'Memory') {
        valA = a.data('memory')?.toString() ?? '';
        valB = b.data('memory')?.toString() ?? '';
      } else if (key === 'Addr') {
        valA = a.data('local_addr')?.toString() ?? '';
        valB = b.data('local_addr')?.toString() ?? '';
      } else if (key === 'Port') {
        valA = a.data('local_port')?.toString() ?? '';
        valB = b.data('local_port')?.toString() ?? '';
      } else if (key === 'Uptime') {
        valA = a.data('uptime')?.toString() ?? '';
        valB = b.data('uptime')?.toString() ?? '';
      }
      const cmp = sorter(valA, valB);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}