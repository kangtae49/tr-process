import ProcessTreeListView from "@/components/ProcessTreeListView.tsx";
import {useTreeStore} from "@/stores/treeStore.ts";
function ProcessTreeView() {
  const tree = useTreeStore((state) => state.tree);
  return tree && (
    <div className="tree-pane">
      <ProcessTreeListView />
    </div>
  )
}

export default ProcessTreeView;
