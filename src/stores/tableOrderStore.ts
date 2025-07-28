import { create } from 'zustand'
import {OrdItm} from "@/components/ordering.ts";

export interface TableOrderStore {
  tableOrder: OrdItm
  setTableOrder: (tableOrder: OrdItm) => void
}

export const useTableOrderStore = create<TableOrderStore>((set) => ({
  tableOrder: { nm: 'Name', asc: 'Asc' },
  setTableOrder: (tableOrder: OrdItm): void =>
    set(() => ({
      tableOrder
    }))
}))
