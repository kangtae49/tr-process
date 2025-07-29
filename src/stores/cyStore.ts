import { create } from "zustand"
import cytoscape from 'cytoscape';

export interface CyStore {
  cyInstance: cytoscape.Core | undefined,
  setCyInstance: (cy: cytoscape.Core) => void
}

export const useCyStore = create<CyStore>((set) => ({
  cyInstance: undefined,
  setCyInstance: (cyInstance: cytoscape.Core) => set(() => ({ cyInstance }))
}))
