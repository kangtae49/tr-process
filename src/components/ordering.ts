import cytoscape from "cytoscape";
import natsort from 'natsort';

export type OrdAsc = "Asc" | "Desc";
export type OrdBy = "Pid" | "Ppid" | "Name" | "Addr" | "Port" | "Memory";
export type OrdItm = { nm: OrdBy; asc: OrdAsc };




export function sort_items(items: cytoscape.ElementDefinition[], ordItms: OrdItm[]) {
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
        valA = a.data?.id?.toString() ?? '';
        valB = b.data?.id?.toString() ?? '';
      } else if (key === 'Ppid') {
        valA = a.data?.process?.parent?.toString() ?? '';
        valB = b.data?.process?.parent?.toString() ?? '';
      } else if (key === 'Name') {
        valA = a.data?.process?.name?.toString() ?? '';
        valB = b.data?.process?.name?.toString() ?? '';
      } else if (key === 'Memory') {
        valA = a.data?.process?.memory?.toString() ?? '';
        valB = b.data?.process?.memory?.toString() ?? '';
      } else if (key === 'Addr') {
        valA = a.data?.socket?.local_addr?.toString() ?? '';
        valB = b.data?.socket?.local_addr?.toString() ?? '';
      } else if (key === 'Port') {
        valA = a.data?.socket?.local_port?.toString() ?? '';
        valB = b.data?.socket?.local_port?.toString() ?? '';
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