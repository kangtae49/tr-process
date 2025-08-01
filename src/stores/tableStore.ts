import { create } from "zustand"
import {ProcessInfo} from "@/bindings.ts";

export interface TableStore {
  table: ProcessInfo[] | undefined,
  setTable: (table: ProcessInfo[]) => void
}

export const useTableStore = create<TableStore>((set) => ({
  table: undefined,
  setTable: (table: ProcessInfo[]) => set(() => ({ table }))
}))
