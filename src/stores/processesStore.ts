import { create } from "zustand"
import { ProcessInfo } from "@/bindings.ts";

export interface ProcessesStore {
  processes: ProcessInfo[] | undefined,
  setProcesses: (processes: ProcessInfo[]) => void
}

export const useProcessesStore = create<ProcessesStore>((set) => ({
  processes: undefined,
  setProcesses: (processes: ProcessInfo[]) => set(() => ({ processes }))
}))
