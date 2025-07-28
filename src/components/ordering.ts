import cytoscape from "cytoscape";
import natsort from 'natsort';
import {Item} from "@/components/ProcessGraphView.tsx";

export type OrdAsc = "Asc" | "Desc";
export type OrdBy = "Pid" | "Ppid" | "Name" | "Addr" | "Port" | "Memory";
export type OrdItm = { nm: OrdBy; asc: OrdAsc };




export function sort_items(items: Item[], ordItms: OrdItm[]) {
  const sorters = ordItms.map(ordItm => ({
    key: ordItm.nm,
    sorter: natsort({
      insensitive: true,
      desc: ordItm.asc === 'Desc',
    }),
  }));

  return items.sort((a, b) => {
    for (const { key, sorter }of sorters) {
      let valA = '';
      let valB = '';
      if (key === 'Pid') {
        valA = a.id?.toString() ?? '';
        valB = b.id?.toString() ?? '';
      } else if (key === 'Ppid') {
        valA = a.process?.parent?.toString() ?? '';
        valB = b.process?.parent?.toString() ?? '';
      } else if (key === 'Name') {
        valA = a.process?.name?.toString() ?? '';
        valB = b.process?.name?.toString() ?? '';
      } else if (key === 'Memory') {
        valA = a.process?.memory?.toString() ?? '';
        valB = b.process?.memory?.toString() ?? '';
      } else if (key === 'Addr') {
        valA = a.socket?.local_addr?.toString() ?? '';
        valB = b.socket?.local_addr?.toString() ?? '';
      } else if (key === 'Port') {
        valA = a.socket?.local_port?.toString() ?? '';
        valB = b.socket?.local_port?.toString() ?? '';
      }
      const cmp = sorter(valA, valB);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

/*
sort_items(elements, [
  { nm: "Pid", asc: "Asc" },
  { nm: "Name", asc: "Desc" }
]);
 */