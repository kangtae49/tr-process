import { create } from "zustand"
import {Item} from "@/components/ProcessGraphView.tsx";

export interface TableStore {
  table: Item[] | undefined,
  setTable: (table: Item[]) => void
}

export const useTableStore = create<TableStore>((set) => ({
  table: undefined,
  setTable: (table: Item[]) => set(() => ({ table }))
}))
