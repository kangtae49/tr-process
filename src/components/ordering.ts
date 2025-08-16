import natsort from 'natsort';
import {ProcessInfo} from "@/bindings.ts";
import {get_local_addr, get_local_port} from "@/components/ProcessGraphView.tsx";

export type OrdAsc = "Asc" | "Desc";
export type OrdBy = "Pid" | "Ppid" | "Name" | "Addr" | "Port" | "Memory" | "Uptime";
export type OrdItm = { nm: OrdBy; asc: OrdAsc };




export function sort_items(items: ProcessInfo[], ordItms: OrdItm[]) {
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
        valA = a.pid?.toString() ?? '';
        valB = b.pid?.toString() ?? '';
      } else if (key === 'Ppid') {
        valA = a.ppid?.toString() ?? '';
        valB = b.ppid?.toString() ?? '';
      } else if (key === 'Name') {
        valA = a.name?.toString() ?? '';
        valB = b.name?.toString() ?? '';
      } else if (key === 'Memory') {
        valA = a.memory?.toString() ?? '';
        valB = b.memory?.toString() ?? '';
      } else if (key === 'Addr') {
        valA = get_local_addr(a)?.toString() ?? '';
        valB = get_local_addr(b)?.toString() ?? '';
      } else if (key === 'Port') {
        valA = get_local_port(a)?.toString() ?? '';
        valB = get_local_port(b)?.toString() ?? '';
      } else if (key === 'Uptime') {
        valA = a.uptime?.toString() ?? '';
        valB = b.uptime?.toString() ?? '';
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