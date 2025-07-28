import { create } from "zustand"
import cytoscape from "cytoscape";

export interface TableStore {
  table: cytoscape.ElementDefinition[] | undefined,
  setTable: (table: cytoscape.ElementDefinition[]) => void
}

export const useTableStore = create<TableStore>((set) => ({
  table: undefined,
  setTable: (table: cytoscape.ElementDefinition[]) => set(() => ({ table }))
}))
