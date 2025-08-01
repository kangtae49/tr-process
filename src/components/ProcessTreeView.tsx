import ProcessTreeListView from "@/components/ProcessTreeListView.tsx";
import {useTreeStore} from "@/stores/treeStore.ts";
function ProcessTreeView() {
  return (
    <div className="tree-pane">
      <ProcessTreeListView />
    </div>
  )
}

export default ProcessTreeView;
