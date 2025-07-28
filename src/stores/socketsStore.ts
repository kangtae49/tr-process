import { create } from "zustand"
import { SockInfo } from "@/bindings.ts";

export interface SocketsStore {
  sockets: SockInfo[] | undefined,
  setSockets: (sockets?: SockInfo[]) => void
}

export const useSocketsStore = create<SocketsStore>((set) => ({
  sockets: undefined,
  setSockets: (sockets?: SockInfo[]) => set(() => ({ sockets }))
}))
