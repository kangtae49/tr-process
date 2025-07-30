import {useState} from "react";
import { SplitPane } from '@rexxars/react-split-pane'
import ProcessTableView from "@/components/ProcessTableView.tsx";
import ProcessTreeView from "@/components/ProcessTreeView.tsx";
import ProcessGraphView from "@/components/ProcessGraphView.tsx";

function ProcessView() {
  const [isResizing, setIsResizing] = useState(false);
  const [isResizing2, setIsResizing2] = useState(false);

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
          <SplitPane
            split="horizontal"
            minSize={0}
            defaultSize={200}
            onDragStarted={() => setIsResizing2(true)}
            onDragFinished={() => setIsResizing2(false)}
          >
            <ProcessTableView />
            <ProcessTreeView />

          </SplitPane>
        </div>
        <div style={{ position: 'relative', height: '100%' }}>

          <ProcessGraphView />
        </div>
        {(isResizing || isResizing2) && <div className="iframe-overlay" />}
      </SplitPane>
    </div>
  )
}

export default ProcessView;
