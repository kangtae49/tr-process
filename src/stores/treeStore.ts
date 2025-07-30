import { create } from "zustand"
import {Item} from "@/components/ProcessGraphView.tsx";

export interface TreeStore {
  tree: Item[] | undefined,
  setTree: (table: Item[]) => void
}

export const useTreeStore = create<TreeStore>((set) => ({
  tree: undefined,
  setTree: (tree: Item[]) => set(() => ({ tree }))
}))
