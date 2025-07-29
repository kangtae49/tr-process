import {useState} from "react";
import { SplitPane } from '@rexxars/react-split-pane'
import ProcessTableView from "@/components/ProcessTableView.tsx";
import ProcessTreeView from "@/components/ProcessTreeView.tsx";
import ProcessGraphView from "@/components/ProcessGraphView.tsx";

function ProcessView() {
  const [isResizing, setIsResizing] = useState(false)
  return (
    <div className="main-pane">
      <SplitPane
        split="vertical"
        // primary="second"
        minSize={0}
        defaultSize={200}
        onDragStarted={() => setIsResizing(true)}
        onDragFinished={() => setIsResizing(false)}
      >
        <div className="left-pane">
          <ProcessTableView />
          <ProcessTreeView />
        </div>
        <div style={{ position: 'relative', height: '100%' }}>
          {isResizing && <div className="iframe-overlay" />}
          <ProcessGraphView />
        </div>
      </SplitPane>
    </div>
  )
}

export default ProcessView;
