import { create } from "zustand"
import { SockInfo } from "@/bindings.ts";

export interface SocketsStore {
  sockets: SockInfo[],
  setSockets: (sockets: SockInfo[]) => void
}

export const useSocketsStore = create<SocketsStore>((set) => ({
  sockets: [],
  setSockets: (sockets: SockInfo[]) => set(() => ({ sockets }))
}))
