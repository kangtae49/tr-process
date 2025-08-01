import { create } from "zustand"

export interface SelectedPidStore {
  selectedPid: number | undefined | null,
  setSelectedPid: (selectedPid: number | undefined) => void
}

export const useSelectedPidStore = create<SelectedPidStore>((set) => ({
  selectedPid: undefined,
  setSelectedPid: (selectedPid: number | undefined) => set(() => ({ selectedPid }))
}))
