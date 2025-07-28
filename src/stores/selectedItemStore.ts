import { create } from "zustand"
import {Item} from "@/components/ProcessGraphView.tsx";

export interface SelectedItemStore {
  selectedItem: Item | undefined,
  setSelectedItem: (selectedItem?: Item) => void
}

export const useSelectedItemStore = create<SelectedItemStore>((set) => ({
  selectedItem: undefined,
  setSelectedItem: (selectedItem?: Item) => set(() => ({ selectedItem }))
}))
