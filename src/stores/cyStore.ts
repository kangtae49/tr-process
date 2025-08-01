import { create } from "zustand"
import cytoscape from 'cytoscape';

export interface CyStore {
  cyInstance: cytoscape.Core | null,
  setCyInstance: (cy: cytoscape.Core | null) => void
}

export const useCyStore = create<CyStore>((set) => ({
  cyInstance: null,
  setCyInstance: (cyInstance: cytoscape.Core | null) => set(() => ({ cyInstance }))
}))
