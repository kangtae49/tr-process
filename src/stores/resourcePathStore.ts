import { create } from "zustand"

export interface ResourcePathStore {
  resourcePath: string | undefined,
  setResourcePath: (resource_path?: string) => void
}

export const useResourcePathStore = create<ResourcePathStore>((set) => ({
  resourcePath: undefined,
  setResourcePath: (resourcePath?: string) => set(() => ({ resourcePath }))
}))
