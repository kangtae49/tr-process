import { Handle, Position} from '@xyflow/react';
import {ProcessData} from "@/routes/ProcessView.tsx";

function ProcessNodeView({ data }: {data: ProcessData}) {
  return (
    <div style={{ padding: 10, border: '1px solid black' }}>
      <div style={{fontSize: '0.8em'}}>{data.label}</div>
      {data.ports.map((id: string, index: number) => (
        <Handle
          key={id}
          type="source"
          position={Position.Top}
          id={id}
          style={{ top: -15, left: 5 + index * 20 }}
        >
          <div style={{fontSize: "0.4em"}}>{id}</div>
        </Handle>
      ))}
      <Handle
        type="source"
        position={Position.Bottom}
        id={"source"}
      />
      <Handle
        type="target"
        position={Position.Top}
        id={"target"}
      />
    </div>
  );
}

export default ProcessNodeView;
