import { create } from "zustand"

export interface SelectedPidStore {
  selectedPid: string | undefined,
  setSelectedPid: (selectedPid?: string) => void
}

export const useSelectedPidStore = create<SelectedPidStore>((set) => ({
  selectedPid: undefined,
  setSelectedPid: (selectedPid?: string) => set(() => ({ selectedPid }))
}))
