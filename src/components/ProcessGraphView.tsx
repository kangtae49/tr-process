import React, {useEffect, useState} from 'react';
import {commands, HttpNotify, ProcessInfo, SockInfo} from "@/bindings.ts";
import {useSocketsStore} from "@/stores/socketsStore.ts";
import {useProcessesStore} from "@/stores/processesStore.ts";
import cytoscape, {EventObject} from 'cytoscape';
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
} from '@fortawesome/free-solid-svg-icons'
import { emit } from '@tauri-apps/api/event';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import {useCyStore} from "@/stores/cyStore.ts";

export type Item = {
  id: string
  type: string
  label: string
  color: string
  process: ProcessInfo
  socket?: SockInfo
  info: string
  children?: Item[]
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

    const selectedNode = cy.$(':selected');
    cy.animate({
      fit: {
        eles: selectedNode,
        padding: 230,
      },
      duration: 300,
      easing: 'ease-in-out',
    });

  }

  const clickZoomOut = () => {
    const cy = cyInstance;
    if (!cy) return;

    cy.animate({
      fit: {
        eles: cy.elements(),
        padding: 50
      },
      duration: 500,
      easing: 'ease-in-out'
    });
  }

  const handleSelect = (event: EventObject) => {
    console.log('handleSelect')
    const node = event.target;
    setSelectedItem(node.data());
  }
  const handleUnSelect = (_event: EventObject) => {
    console.log('handleUnSelect')
    setSelectedItem(undefined);
  }


  useEffect(() => {
    if (!cyInstance) return;
    const cy = cyInstance;

    cy.on('select', 'node', handleSelect);
    cy.on('unselect', 'node', handleUnSelect);

    return () => {
      cy.off('select', 'node', handleSelect);
      cy.off('unselect', 'node', handleUnSelect);
    };
  }, [cyInstance]);

  useEffect(() => {
    if (!cyInstance) return;
    if (!selectedItem) return;
    const cy = cyInstance;
    const target = cy.$(`#${selectedItem.id}`);
    if (target.length) {
      cy.nodes().unselect();
      target.select();

      const selectedNode = cy.$(':selected');
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
        // cy.pan(pan);
      }
      // cy.center(cy.nodes());
      // cy.fit(target, 300);
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
        }
      }
    });
    const initialEdges: cytoscape.ElementDefinition[] = [...unique(pidEdges)]; //.sort((a, b) => Number(a.data.source) - Number(b.data.source));
    const nodes_and_edges = [...initialNodes, ...initialEdges];

    setElements(nodes_and_edges);


  }, [processes?.length, sockets?.length]);

  const coseLayout: cytoscape.CoseLayoutOptions = {
    name: "cose",
    // refresh?: number
    // randomize?: boolean
    componentSpacing: 10,
    // nodeRepulsion?(node: any): number
    // nodeOverlap: 200,
    // idealEdgeLength?(edge: any): number
    // edgeElasticity?(edge: any): number
    edgeElasticity: 100,
    nestingFactor: 1,
    fit: true,
    animate: true,
    padding: 50,
    nodeOverlap: 150,
    idealEdgeLength: 100,
    gravity: 0.05,
    numIter: 1000,
  }

  const style: React.CSSProperties = {
    width: "100%",
    height: "100vh"
  }

  const stylesheet: cytoscape.StylesheetStyle[] = [
    {
      selector: 'node',
      style: {
        label: 'data(info)',
        'text-valign': 'center',
        'text-halign': 'center',
        'background-color': 'data(color)',
        color: '#000',
        width: 150,
        height: 150,
        'text-wrap': 'wrap',
        'font-size': 20,
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#a63131',
        'border-color': '#af0707',
        'border-width': 10,
      }
    },
    {
      selector: 'edge',
      style: {
        width: 6,
        'curve-style': 'bezier',
        'line-color': '#c6b6b6',
        'target-arrow-color': '#e83d3d',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.5
      }
    }
  ];

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
        {selectedItem && (
          <div className="zoom-in">
            <Icon icon={faMagnifyingGlassPlus} onClick={() => clickZoomIn()} />
          </div>
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
          layout={coseLayout}
          elements={elements}
          style={{
            ...style,
            width,
            height
          }}
          stylesheet={stylesheet}
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