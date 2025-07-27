import React, {useEffect, useRef} from 'react';
import {commands, ProcessInfo, SockInfo} from "@/bindings.ts";
import {useSocketsStore} from "@/stores/socketsStore.ts";
import {useProcessesStore} from "@/stores/processesStore.ts";
import cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import {useElementsStore} from "@/stores/elementsStore.ts";
import {get_mem} from "@/components/utils.ts";
import AutoSizer from 'react-virtualized-auto-sizer'
import {useSelectedPidStore} from "@/stores/selectedPidStore.ts";

function ProcessGraphView() {
  const sockets = useSocketsStore((state) => state.sockets);
  const setSockets = useSocketsStore((state) => state.setSockets);
  const processes = useProcessesStore((state) => state.processes);
  const setProcesses = useProcessesStore((state) => state.setProcesses);
  const elements = useElementsStore((state) => state.elements);
  const setElements = useElementsStore((state) => state.setElements);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.on('select', 'node', (event) => {
      const node = event.target;
      setSelectedPid(node.id());
    });

    cy.on('unselect', 'node', (_evt) => {
      setSelectedPid(undefined);
    });


  }, [cyRef.current]);

  useEffect(() => {
    if (!cyRef.current) return;
    if (!selectedPid) return;
    const cy = cyRef.current;
    const target = cy.$(`#${selectedPid}`);
    if (target.length) {
      cy.nodes().unselect();
      target.select();
      cy.fit(target, 300);
    }
  }, [selectedPid, cyRef.current]);

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
        setSockets(sockets);
      }
    });
  }, []);

  useEffect(() => {
    if (processes === undefined || sockets === undefined) return;
    const pidNodes: cytoscape.ElementDefinition[] = processes.map((process) => {
      let find_socket = sockets.find((sock) => sock.pids.includes(process.pid));
      const color = find_socket ? '#f4a261' : '#1f77b4';
      return {
        data: {
          id: `${process.pid}`,
          type: 'node',
          // source: `${process.pid}`,
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
            process: undefined,
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

  const layout: cytoscape.LayoutOptions = {
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
        label: 'data(info)',
        'text-valign': 'center',
        'text-halign': 'center',
        'background-color': '#a63131',
        'border-color': '#af0707',
        'border-width': 10,
        color: '#000',
        width: 150,
        height: 150,
        'text-wrap': 'wrap',
        'font-size': 20,
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
    <AutoSizer>
      {({ height, width }) => (
        // @ts-ignore
      <CytoscapeComponent
        className="graph-pane"
        layout={layout}
        elements={elements}
        style={{
          ...style,
          width,
          height
        }}
        stylesheet={stylesheet}
        cy={(cy) => { cyRef.current = cy; }}
      />
      )}
    </AutoSizer>
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