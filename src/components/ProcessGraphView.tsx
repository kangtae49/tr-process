import React, {useCallback, useEffect} from 'react';
import {commands, HttpNotify, ProcessInfo, SockInfo} from "@/bindings.ts";
import {useSocketsStore} from "@/stores/socketsStore.ts";
import {useProcessesStore} from "@/stores/processesStore.ts";
import cytoscape, {CollectionReturnValue, EventObject, NodeCollection, NodeSingular} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import {useElementsStore} from "@/stores/elementsStore.ts";
import {get_mem} from "@/components/utils.ts";
import AutoSizer from 'react-virtualized-auto-sizer'
import {useSelectedItemStore} from "@/stores/selectedItemStore.ts";
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import {
  faFolder,
  faArrowRotateRight,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faMinimize,
  faMaximize,
} from '@fortawesome/free-solid-svg-icons'
import { emit } from '@tauri-apps/api/event';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import {useCyStore} from "@/stores/cyStore.ts";
import {useTreeStore} from "@/stores/treeStore.ts";
import {getTree} from "@/components/ProcessTreeListView.tsx";
import {
  breadthFirstLayoutOptions,
  concentricLayoutOptions, coseLayoutOptions,
  graphStylesheet,
  gridLayoutOptions
} from "@/components/graph.ts";

export type Item = {
  id: string
  type: string
  label: string
  color: string
  process: ProcessInfo
  socket?: SockInfo
  info: string
  children?: Item[]
  parent?: Item
}


function ProcessGraphView() {
  const sockets = useSocketsStore((state) => state.sockets);
  const setSockets = useSocketsStore((state) => state.setSockets);
  const processes = useProcessesStore((state) => state.processes);
  const setProcesses = useProcessesStore((state) => state.setProcesses);
  const elements = useElementsStore((state) => state.elements);
  const setElements = useElementsStore((state) => state.setElements);
  const selectedItem = useSelectedItemStore((state) => state.selectedItem);
  const setSelectedItem = useSelectedItemStore((state) => state.setSelectedItem);
  const cyInstance = useCyStore((state) => state.cyInstance);
  const setCyInstance = useCyStore((state) => state.setCyInstance);



  const shellShowItemInFolder = async (path: string | undefined | null) => {
    if (!path) return
    return await revealItemInDir(path)
  }

  const clickRefresh = () => {
    const httpNotify: HttpNotify = {
      cmd: 'Refresh'
    }
    emit('http', httpNotify).then();
  }

  const clickZoomIn = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedItem) {
      cy.animate({
        zoom: cy.zoom() * 1.3,
        center: { eles: cy.elements(':selected') },
        duration: 300,
        easing: 'ease-in-out',
      });
    } else {
      cy.zoom(cy.zoom() * 1.1);
    }

  }

  const clickZoomOut = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedItem) {
      cy.animate({
        zoom: cy.zoom() / 1.3,
        center: { eles: cy.elements(':selected') },
        duration: 500,
        easing: 'ease-in-out'
      });
    } else {
      cy.zoom(cy.zoom() / 1.1);
    }
  }
  const clickZoomMin = () => {
    const cy = cyInstance;
    if (!cy) return;

    if (selectedItem) {
      cy.animate({
        fit: {
          // eles: cy.$(':selected'),
          eles: cy.nodes(':selected'),
          padding: 230,
        },
        duration: 300,
        easing: 'ease-in-out',
      });
    }

  }

  const clickZoomMax = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedItem) {
      cy.animate({
        fit: {
          eles: cy.elements(),
          padding: 50
        },
        duration: 500,
        easing: 'ease-in-out'
      });
    }
  }


  const handleNodeSelect = useCallback((event: EventObject) => {
    console.log('handleNodeSelect')
    const node = event.target;
    setSelectedItem(node.data());
  }, [])
  const handleNodeUnSelect = useCallback((event: EventObject) => {
    console.log('handleNodeUnSelect', event);
    const node = event.target;
    setSelectedItem(undefined);
    // setSelectedItem(undefined);
    // cyInstance?.nodes().unselect();
    // cyInstance?.edges().unselect();
    // setSelectedItem(event.target.data());
  }, [])

  const handleEdgeSelect = useCallback((event: EventObject) => {
    console.log('handleEdgeSelect', event)

  }, [])
  const handleEdgeUnSelect = useCallback((event: EventObject) => {
    console.log('handleEdgeUnSelect', event)
    setSelectedItem(undefined);
    // event.target.edges().select();
  }, [])
  useEffect(() => {
    if (!cyInstance) return;
    const cy = cyInstance;
    cy?.autounselectify(false);

    cy.on('select', 'node', handleNodeSelect);
    cy.on('unselect', 'node', handleNodeUnSelect);
    cy.on('select', 'edge', handleEdgeSelect);
    cy.on('unselect', 'edge', handleEdgeUnSelect);

    return () => {
      cy.off('select', 'node', handleNodeSelect);
      cy.off('unselect', 'node', handleNodeUnSelect);
      cy.off('select', 'edge', handleEdgeSelect);
      cy.off('unselect', 'edge', handleEdgeUnSelect);
    };
  }, [cyInstance]);

  useEffect(() => {
    if (!cyInstance) return;
    cyInstance.edges(':selected').unselect();
    cyInstance.nodes(':selected').unselect();
    if (selectedItem == undefined) {
      return;
    }

    const cy = cyInstance;

    const target = cy.$(`#${selectedItem.id}`);
    target.select();
    const selectedNode = cy.$(':selected');
    console.log('animation before', target);
    if (target.length > 0) {
      // cy.nodes().unselect();


      if (selectedNode.nonempty()) {
        const pos = selectedNode.position();
        const pan = {
          x: cy.width() / 2 - pos.x * cy.zoom(),
          y: cy.height() / 2 - pos.y * cy.zoom(),
        };
        cy.animate({
          pan: pan,
          duration: 500,
          easing: 'ease-in-out' // 'linear', 'ease-in', 'ease-out', 등
        });
      }
      // cy.edges(':selected').unselect();
      let current: CollectionReturnValue | NodeSingular = selectedNode;
      while (true) {
        const incomingEdge = current.incomers('edge');
        if (incomingEdge.empty()) break;
        incomingEdge.select();
        const parentNodes = incomingEdge.sources();

        if (parentNodes.empty()) break;
        current = parentNodes.first();
      }
    }
  }, [selectedItem]);

  useEffect(() => {
    commands.getProcesses().then((res) => {
      if (res.status == 'ok') {
        const processes = res.data;
        setProcesses(processes);
      }
    });
  }, []);

  useEffect(() => {
    commands.getSockets().then((res) => {
      if (res.status == 'ok') {
        const sockets = res.data;
        console.log('sockets', sockets);
        setSockets(sockets);
      }
    });
  }, []);

  useEffect(() => {
    if (processes === undefined || sockets === undefined) return;
    const pidNodes: cytoscape.ElementDefinition[] = processes.map((process) => {
      const find_socket = sockets.find((sock) => sock.pids.includes(process.pid));
      const color = find_socket ? '#f4a261' : '#1f77b4';
      return {
        data: {
          id: `${process.pid}`,
          type: 'node',
          label: `${process.pid}`,
          color: color,
          process: process,
          socket: find_socket,
          info: get_info(process, find_socket),
        },
      }
    });

    const ppidNodes: cytoscape.ElementDefinition[] = processes
      .filter((p) => p.parent !== undefined)
      .filter((p) => !processes.some((pp)=> pp.pid == p.parent))
      .map((process) => {
        return {
          data: {
            id: `${process.parent}`,
            type: 'node',
            label: `${process.parent}`,
            color: '#aeaaaa',
            process: {
              pid: process.parent,
            },
            socket: undefined,
            info: `pid: ${process.parent}`,
          }
        }
      });

    const initialNodes: cytoscape.ElementDefinition[] = [...unique(pidNodes), ...unique(ppidNodes)]; //.sort((a, b) => Number(a.data.source) - Number(b.data.source));

    const pidEdges: cytoscape.ElementDefinition[] = processes
      .filter((process) => (process.parent !== null && process.parent !== undefined ))
      // .filter((process) => processes.some((p)=> p.pid === process.parent))
      .map((process) => {
      return {
        data: {
          id: `${process.parent}-${process.pid}`,
          type: 'edge',
          source: `${process.parent}`,
          target: `${process.pid}`,
          label: `${process.parent}-${process.pid}`,
        },
        selectable: true
      }
    });
    const initialEdges: cytoscape.ElementDefinition[] = [...unique(pidEdges)]; //.sort((a, b) => Number(a.data.source) - Number(b.data.source));
    const nodes_and_edges = [...initialNodes, ...initialEdges];
    console.log('setElements')
    setElements(nodes_and_edges);

  }, [processes, sockets]);



  if (!elements) {
    return <div>Loading...</div>;
  }

  return (
    <div className="graph-pane">
      <div className="header">
        <div className="refresh">
          <Icon icon={faArrowRotateRight} onClick={() => clickRefresh()} />
        </div>
        <div className="zoom-out">
          <Icon icon={faMagnifyingGlassMinus} onClick={() => clickZoomOut()} />
        </div>
        <div className="zoom-in">
          <Icon icon={faMagnifyingGlassPlus} onClick={() => clickZoomIn()} />
        </div>
        {selectedItem && (
          <>
            <div className="zoom-max">
              <Icon icon={faMaximize} onClick={() => clickZoomMax()} />
            </div>
            <div className="zoom-min">
              <Icon icon={faMinimize} onClick={() => clickZoomMin()} />
            </div>
          </>
        )}

        {selectedItem && selectedItem.process?.exe && (
          <div className="folder" onClick={() => shellShowItemInFolder(selectedItem.process?.exe)}><Icon icon={faFolder} /></div>
        )}
        {selectedItem && (
          <div className="label">[{selectedItem.id}] {selectedItem.process?.exe || selectedItem.process?.name || ''}</div>
        )}

      </div>
      <AutoSizer>
        {({ height, width }) => (
          // @ts-ignore
        <CytoscapeComponent
          className="graph"
          layout={coseLayoutOptions}
          elements={elements}
          style={{
            width,
            height
          }}
          stylesheet={graphStylesheet}
          cy={setCyInstance}
        />
        )}
      </AutoSizer>
    </div>
  )
}

export default ProcessGraphView;

function get_info(process: ProcessInfo | undefined, socket: SockInfo | undefined) {
  const ret = [
    `${process?.name}`,
    `pid: ${process?.pid}`,
    `ppid: ${process?.parent}`,
    `mem: ${get_mem(process?.memory)}`,
    `local: ${socket?.local_addr}:${socket?.local_port}`,
    `remote: ${socket?.remote_addr}:${socket?.remote_port}`,
    // `total_read_bytes: ${process.disk_usage.total_read_bytes}`,
    // `total_write_bytes: ${process.disk_usage.total_write_bytes}`,
  ].filter((x) => !x.endsWith('undefined'));
  return ret.join('\n')
}

function unique(arr: any[]) {
  return Array.from(
    new Set(arr.map(o => JSON.stringify(o)))
  ).map(str => JSON.parse(str));
}