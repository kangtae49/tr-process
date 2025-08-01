import { create } from "zustand"
import {ProcessTreeNode} from "@/bindings.ts";

export interface TreeStore {
  tree: ProcessTreeNode[] | undefined,
  setTree: (table?: ProcessTreeNode[]) => void
}

export const useTreeStore = create<TreeStore>((set) => ({
  tree: undefined,
  setTree: (tree?: ProcessTreeNode[]) => set(() => ({ tree }))
}))
