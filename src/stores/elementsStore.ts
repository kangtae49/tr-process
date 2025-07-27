import { create } from "zustand"
import cytoscape from "cytoscape";

export interface ElementsStore {
  elements: cytoscape.ElementDefinition[] | undefined,
  setElements: (sockets: cytoscape.ElementDefinition[]) => void
}

export const useElementsStore = create<ElementsStore>((set) => ({
  elements: undefined,
  setElements: (elements: cytoscape.ElementDefinition[]) => set(() => ({ elements }))
}))
