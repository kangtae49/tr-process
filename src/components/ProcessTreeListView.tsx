import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import {useEffect, useRef} from "react";
import {useTableStore} from "@/stores/tableStore.ts";
import {Item} from "@/components/ProcessGraphView.tsx";
import {get_mem} from "@/components/utils.ts";
import {useSelectedItemStore} from "@/stores/selectedItemStore.ts";
import {useCyStore} from "@/stores/cyStore.ts";
import cytoscape, {NodeCollection, NodeDataDefinition} from "cytoscape";
import {ProcessInfo} from "@/bindings.ts";
import {useElementsStore} from "@/stores/elementsStore.ts";
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import {
  faCirclePlus,
  faSquarePlus,
  faPlus,
  faFolderPlus,
  faFile
} from '@fortawesome/free-solid-svg-icons'

const ITEM_SIZE = 18;



function ProcessTreeListView() {
  const selectedItem = useSelectedItemStore((state) => state.selectedItem);
  const setSelectedItem = useSelectedItemStore((state) => state.setSelectedItem);
  const cyInstance = useCyStore((state) => state.cyInstance);
  const elements = useElementsStore((state) => state.elements);
  const listRef = useRef<List>(null);



  const clickItem = (item: Item) => {
    console.log(item);
    if (item) {
      setSelectedItem(item);
    }
  }

  // useEffect(() => {
  //   if (selectedItem == undefined || !listRef.current) return;
  //   const idx = table?.findIndex((item) => item.id == selectedItem.id);
  //   // console.log('idx', idx);
  //   if (idx) {
  //     // listRef.current.scrollTo(idx);
  //     listRef.current.scrollToItem(idx, "center");
  //   }
  // }, [selectedItem]);


  // useEffect(() => {
  //   if (elements === undefined) return;
  //   getTree(elements);
  // }, [elements]);
  const tree = getTree(elements);
  if (!elements) return null;
  return (
    <div className="tree">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="tree-list"
            height={height}
            itemCount={getCountOfTreeItems(elements)}
            itemSize={ITEM_SIZE}
            width={width}
            ref={listRef}
          >
            {({ index, style }) => {
              const [item, _idx, depth] = getNthOfTreeItems(tree, index);
              const dep = Array.from({ length: depth }, (_, i) => i);
              return item ? (
              <div className="row-tree" key={index} style={{...style, backgroundColor: `${selectedItem?.id == item.id ? '#bfd2e3': null}`}} onClick={() => clickItem(item)}>
                {dep.map((depIdx)=> {
                  const color = depIdx % 2 === 0 ? '#c8ada4' : '#6a99b8'
                  return (
                  <div className="depth" key={depIdx}>
                    <svg width="100%" height="100%">
                      <line x1="7" y1="0" x2="7" y2="100%" stroke={color} strokeWidth="2" />
                    </svg>
                  </div>
                )})}
                { (((item.children?.length || 0) > 0) || (depth == 0)) ? (
                  <div className="icon">
                    <Icon icon={faFolderPlus} />
                  </div>
                ) : (
                  <div className="icon">
                    <Icon icon={faFile} />
                  </div>
                )}
                <div className="row">
                  <div className="col pid">{item.id}</div>
                  <div className="col ppid">{item.process.parent || ''}</div>
                  <div className="col name">{item.process.name || ''}</div>
                  <div className="col addr">{item.socket?.local_addr || ''}</div>
                  <div className="col port">{item.socket?.local_port || ''}</div>
                  <div className="col memory">{get_mem(item.process.memory) || ''}</div>
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


function getTree(elements: cytoscape.ElementDefinition[] | undefined): Item [] {
  if (!elements) return [];
  let itemList = elements
      .map((elem) => elem.data)
      .filter((data) => (data.type === 'node'))
      .map((data)=> data as Item)
  ;
  const rootList = itemList
      .filter((data) => (!data.process?.parent))
      .map((data)=> data)

  const pids = rootList.map((data) => data.process.pid);
  itemList = itemList.filter((data) => !pids.includes(data.process.pid));
  appendChildren(rootList, itemList);
  return rootList;
}

function appendChildren(rootList: Item [], itemList: Item []) {
  for (const root of rootList) {
    const children = getChildren(itemList, root);
    root.children = children;
    const pids = children.map((data) => data.process.pid);
    itemList = itemList.filter((data) => !pids.includes(data.process.pid));
    appendChildren(children, itemList);
  }
}

function getChildren(itemList: Item [], item: Item): Item [] {
  return itemList.filter((data) => data.process?.parent == item.process.pid)
}



function getNthOfTreeItems(rootList: Item [], nth: number): [Item | undefined, number, number] {
  const [item, index, depth] = getNth(rootList, nth, -1, 0);
  return [item, index, depth];
}
function getCountOfTreeItems(elements: cytoscape.ElementDefinition[]): number {
  let itemList = elements
    .map((elem) => elem.data)
    .filter((data) => (data.type === 'node'))
    .map((data)=> data as Item)
  ;
  return itemList.length;
}

function getDepth(cyInstance: cytoscape.Core, pid: number): number {
  let depth = 0;
  let currentPid: number | undefined | null = pid;

  while (true) {
    let item: Item | undefined = cyInstance.getElementById(`${currentPid}`).data();
    currentPid = item?.process?.parent;
    if (currentPid == undefined) {
      break;
    }
    depth++;
  }
  return depth;
}
function getNth(treeItems: Item [] | undefined, nth: number, curIdx = -1, curDepth = 0): [treeItem: Item | undefined, number, number] {
  let findTreeItem: Item | undefined = undefined
  if (!treeItems) {
    return [findTreeItem, curIdx, curDepth]
  }
  for (let idxItem = 0; idxItem < treeItems.length; idxItem++) {
    curIdx++
    if (curIdx == nth) {
      findTreeItem = treeItems[idxItem]
      break
    }

    const [findItem, nextIdx, findDepth] = getNth(treeItems[idxItem]?.children, nth, curIdx, curDepth + 1)
    findTreeItem = findItem
    curIdx = nextIdx
    if (findTreeItem) {
      curDepth = findDepth;
      break
    }
  }
  return [findTreeItem, curIdx, curDepth]

}

export function getCount(treeItems: Item [] | undefined): number {
  if (!treeItems) {
    return 0
  }
  let count = treeItems.length
  for (let idxItem = 0; idxItem < treeItems.length; idxItem++) {
    const treeItem = treeItems[idxItem]
    if (treeItem.children?.length || 0 == 0) {
      continue
    }
    count += getCount(treeItem.children)
  }
  return count
}

