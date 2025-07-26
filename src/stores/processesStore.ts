import { create } from "zustand"
import { ProcessInfo } from "@/bindings.ts";

export interface ProcessesStore {
  processes: ProcessInfo[],
  setProcesses: (processes: ProcessInfo[]) => void
}

export const useProcessesStore = create<ProcessesStore>((set) => ({
  processes: [],
  setProcesses: (processes: ProcessInfo[]) => set(() => ({ processes }))
}))
