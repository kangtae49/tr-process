import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import {useEffect, useRef} from "react";
import {Item} from "@/components/ProcessGraphView.tsx";
import {get_mem} from "@/components/utils.ts";
import {useSelectedItemStore} from "@/stores/selectedItemStore.ts";
import cytoscape from "cytoscape";
import {useElementsStore} from "@/stores/elementsStore.ts";
import {useTreeStore} from "@/stores/treeStore.ts";

const ITEM_SIZE = 18;



function ProcessTreeListView() {
  const selectedItem = useSelectedItemStore((state) => state.selectedItem);
  const setSelectedItem = useSelectedItemStore((state) => state.setSelectedItem);
  const elements = useElementsStore((state) => state.elements);
  const tree = useTreeStore((state) => state.tree);
  const setTree = useTreeStore((state) => state.setTree);

  const listRef = useRef<List>(null);



  const clickItem = (item: Item | undefined) => {
    console.log(item);
    setSelectedItem(item);
  }

  useEffect(() => {
    console.log('tree selected');
    if (selectedItem == undefined || !tree || !listRef.current) return;

    const idx = getIndexFromItem(tree, selectedItem);
    console.log('tree selected', idx, tree);
    if (idx) {
      listRef.current.scrollToItem(idx, "center");
    }
  }, [selectedItem, tree, elements]);

  useEffect(() => {
    setTree(getTree(elements));
  }, [elements]);


  if (!tree) return null;
  console.log('render tree');
  return (
    <div className="tree">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="tree-list"
            height={height}
            itemCount={getCountOfTreeItems(tree)}
            itemSize={ITEM_SIZE}
            width={width}
            ref={listRef}
          >
            {({ index, style }) => {
              const [item, _idx, depth] = getItemFromIndex(tree, index);
              const dep = Array.from({ length: depth }, (_, i) => i);
              return item ? (
              <div className="row-tree" key={index} style={{...style, backgroundColor: `${selectedItem?.id == item.id ? '#bfd2e3': null}`}} >
                {dep.map((depIdx)=> {
                  return (
                  <div className="depth" key={depIdx} onClick={() => clickItem(getParentItem(item, (depth - depIdx)))}>
                    {getParentItem(item, (depth - depIdx))?.process.pid}
                  </div>
                )})}
                <div className="row">
                  <div className="col pid" onClick={() => clickItem(item)}>{item.id}</div>
                  <div className="col name" title={getTitle(item)} onClick={() => clickItem(item)}>{item.process.name || ''}</div>
                  <div className="col addr" onClick={() => clickItem(item)}>{item.socket?.local_addr || ''}</div>
                  <div className="col port" onClick={() => clickItem(item)}>{item.socket?.local_port || ''}</div>
                  <div className="col memory" onClick={() => clickItem(item)}>{get_mem(item.process.memory) || ''}</div>
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
  console.log('getTree');
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
    children.forEach((c) => {
      c.parent = root
    })
    root.children = children;
    const pids = children.map((data) => data.process.pid);
    itemList = itemList.filter((data) => !pids.includes(data.process.pid));
    appendChildren(children, itemList);
  }
}

function getChildren(itemList: Item [], item: Item): Item [] {
  return itemList.filter((data) => data.process?.parent == item.process.pid)
}



function getItemFromIndex(rootList: Item [], nth: number): [Item | undefined, number, number] {
  const [item, index, depth] = getItemFromNth(rootList, nth, -1, 0);
  return [item, index, depth];
}
// function getCountOfTreeItems(elements: cytoscape.ElementDefinition[]): number {
//   let itemList = elements
//     .map((elem) => elem.data)
//     .filter((data) => (data.type === 'node'))
//     .map((data)=> data as Item)
//   ;
//   return itemList.length;
// }

export function getCountOfTreeItems(treeItems: Item [] | undefined): number {
  if (!treeItems) {
    return 0
  }
  let count = treeItems.length
  for (let idxItem = 0; idxItem < treeItems.length; idxItem++) {
    const treeItem = treeItems[idxItem]
    if (!treeItem.children?.length) {
      continue
    }
    count += getCountOfTreeItems(treeItem.children)
  }
  return count
}

function getIndexFromItem(rootList: Item [] | undefined, item: Item): number | undefined {
  const [findIndex] = getNthFromItem(rootList, item, -1, 0);
  return findIndex;
}


function getItemFromNth(treeItems: Item [] | undefined, nth: number, curIdx = -1, curDepth = 0): [treeItem: Item | undefined, number, number] {
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

    const [findItem, nextIdx, findDepth] = getItemFromNth(treeItems[idxItem]?.children, nth, curIdx, curDepth + 1)
    findTreeItem = findItem
    curIdx = nextIdx
    if (findTreeItem) {
      curDepth = findDepth;
      break
    }
  }
  return [findTreeItem, curIdx, curDepth]

}

function getNthFromItem(treeItems: Item [] | undefined, item: Item, curIdx = -1, curDepth = 0): [number | undefined, number, number] {
  let findIndex: number | undefined = undefined
  if (!treeItems) {
    return [findIndex, curIdx, curDepth]
  }
  for (let idxItem = 0; idxItem < treeItems.length; idxItem++) {
    curIdx++
    if (treeItems[idxItem].id == item.id) {
      findIndex = curIdx
      break
    }

    const [findNth, nextIdx, findDepth] = getNthFromItem(treeItems[idxItem]?.children, item, curIdx, curDepth + 1)
    findIndex = findNth
    curIdx = nextIdx
    if (findIndex) {
      curDepth = findDepth;
      break
    }
  }
  return [findIndex, curIdx, curDepth]


}



function getParentItem(item: Item, nth: number): Item | undefined {
  let curItem: Item | undefined = item;
  for(let i=0; i < nth; i++) {
    curItem = curItem?.parent;
    if (!parent) {
      break;
    }
  }
  return curItem;
}

function getTitle(item: Item): string {
  return item.process.exe || item.process.name || item.id;
}

