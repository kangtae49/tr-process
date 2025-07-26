import {useState, useCallback, useEffect} from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  EdgeChange,
  NodeChange, MarkerType
} from '@xyflow/react';
import { Node, Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import ProcessNodeView from "@/routes/ProcessNodeView.tsx";
import {commands} from "@/bindings.ts";
import {useSocketsStore} from "@/stores/socketsStore.ts";
import {useProcessesStore} from "@/stores/processesStore.ts";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 10;
const nodeHeight = 100;
const nodeTypes = {
  proc: ProcessNodeView,
};
export type ProcessData = {
  label: string;
  pid: string;
  ports: string[];
};
export type ProcessNode = Node<ProcessData, 'proc'>;

// const initialNodes: ProcessNode[] = [
//   {id: 'n1', type: 'proc', data: {label: '1', pid: '1', ports: ['8080', '9090', '7777']}, position: { x: 0, y: 0 }},
//   {id: 'n2', type: 'proc', data: {label: '2', pid: '2', ports: ['8080', '9090', '7777']}, position: { x: 0, y: 0 }},
//   {id: 'n3', type: 'proc', data: {label: '3', pid: '3', ports: ['8080', '9090', '7777']}, position: { x: 0, y: 0 }},
// ];
// const initialEdges: Edge[] = [
//   {id: 'n1-n2', source: 'n1', target: 'n2', sourceHandle: 'source', targetHandle: 'target', markerEnd: {type: MarkerType.ArrowClosed}},
//   {id: 'n1-n3', source: 'n1', target: 'n3', sourceHandle: 'source', targetHandle: 'target', markerEnd: {type: MarkerType.ArrowClosed}},
// ];

function ProcessView() {
  const sockets = useSocketsStore((state) => state.sockets);
  const setSockets = useSocketsStore((state) => state.setSockets);
  const processes = useProcessesStore((state) => state.processes);
  const setProcesses = useProcessesStore((state) => state.setProcesses);

  const [nodes, setNodes] = useState<ProcessNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ProcessNode>[]) => setNodes((nodesSnapshot) => applyNodeChanges<ProcessNode>(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((edgesSnapshot) => applyEdgeChanges<Edge>(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

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
    const initialNodes: ProcessNode[] = processes.map((process) => {
      // {id: 'n3', type: 'proc', data: {label: '3', pid: '3', ports: ['8080', '9090', '7777']}, position: { x: 0, y: 0 }},
      return {
        id: `${process.pid}`,
        type: 'proc',
        data: {
          label: `${process.pid}`,
          pid: `${process.pid}`,
          ports: []
        },
        position: { x: 0, y: 0 }
      }
    });
    console.log(initialNodes);

    const initialEdges: Edge[] = processes
      .filter((process) => process.parent !== null)
      .map((process) => {
      // {id: 'n1-n3', source: 'n1', target: 'n3', sourceHandle: 'source', targetHandle: 'target', markerEnd: {type: MarkerType.ArrowClosed}},
      return {
        id: `${process.parent}-${process.pid}`,
        source: `${process.parent}`,
        target: `${process.pid}`,
        sourceHandle: 'source',
        targetHandle: 'target',
        markerEnd: {type: MarkerType.ArrowClosed}
      }
    });
    console.log(initialEdges);

    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements<ProcessNode>(initialNodes, initialEdges);
    console.log(layoutNodes);
    console.log(layoutEdges);

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [processes, sockets]);
  // if (!layoutNodes || !layoutEdges) return null;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  )
}

export default ProcessView;

export function getLayoutedElements<NodeType extends Node = Node>(nodes: NodeType[], edges: Edge[], direction = 'TB') {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: NodeType[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    return node;
  });

  return { nodes: layoutedNodes, edges };
}