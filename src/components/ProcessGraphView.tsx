import React, {useCallback, useEffect, useRef, useState} from 'react';
import {commands, HttpNotify, ProcessInfo} from "@/bindings.ts";
import cytoscape, {CollectionReturnValue, EventObject, NodeSingular} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import {useElementsStore} from "@/stores/elementsStore.ts";
import {get_mem} from "@/components/utils.ts";
import AutoSizer from 'react-virtualized-auto-sizer'
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import {
  faFolder,
  faArrowRotateRight,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faMinimize,
  faMaximize,
} from '@fortawesome/free-solid-svg-icons'
import { emit } from '@tauri-apps/api/event';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import {useCyStore} from "@/stores/cyStore.ts";
import {
  coseLayoutOptions,
  graphStylesheet,
} from "@/components/graph.ts";
import { useSelectedPidStore } from '@/stores/selectedPidStore';



function ProcessGraphView() {
  const elements = useElementsStore((state) => state.elements);
  const setElements = useElementsStore((state) => state.setElements);
  const selectedPid = useSelectedPidStore((state) => state.selectedPid);
  const setSelectedPid = useSelectedPidStore((state) => state.setSelectedPid);
  const cyInstance = useCyStore((state) => state.cyInstance);
  const setCyInstance = useCyStore((state) => state.setCyInstance);
  const [selectedItem, setSelectedItem] = useState<ProcessInfo | undefined>(undefined);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const shellShowItemInFolder = async (path: string | undefined | null) => {
    if (!path) return
    return await revealItemInDir(path)
  }

  const clickRefresh = () => {
    const httpNotify: HttpNotify = {
      cmd: 'Refresh'
    }
    emit('http', httpNotify).then();
  }

  const clickZoomIn = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedPid) {
      cy.animate({
        zoom: cy.zoom() * 1.3,
        center: { eles: cy.elements(':selected') },
        duration: 300,
        easing: 'ease-in-out',
      });
    } else {
      cy.zoom(cy.zoom() * 1.1);
    }

  }

  const clickZoomOut = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedPid) {
      cy.animate({
        zoom: cy.zoom() / 1.3,
        center: { eles: cy.elements(':selected') },
        duration: 500,
        easing: 'ease-in-out'
      });
    } else {
      cy.zoom(cy.zoom() / 1.1);
    }
  }
  const clickZoomMin = () => {
    const cy = cyInstance;
    if (!cy) return;

    if (selectedPid) {
      cy.animate({
        fit: {
          // eles: cy.$(':selected'),
          eles: cy.nodes(':selected'),
          padding: 230,
        },
        duration: 300,
        easing: 'ease-in-out',
      });
    }

  }

  const clickZoomMax = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedPid) {
      cy.animate({
        fit: {
          eles: cy.elements(),
          padding: 50
        },
        duration: 500,
        easing: 'ease-in-out'
      });
    }
  }


  const handleNodeSelect = useCallback((event: EventObject) => {
    console.log('handleNodeSelect')
    const node = event.target;
    setSelectedPid(node.data('pid'));
  }, [])
  const handleNodeUnSelect = useCallback((event: EventObject) => {
    console.log('handleNodeUnSelect', event);
    setSelectedPid(undefined);
  }, [])

  const handleEdgeSelect = useCallback((event: EventObject) => {
    console.log('handleEdgeSelect', event)

  }, [])
  const handleEdgeUnSelect = useCallback((event: EventObject) => {
    console.log('handleEdgeUnSelect', event)
    setSelectedPid(undefined);
  }, [])
  useEffect(() => {
    if (!cyInstance) return;
    const cy = cyInstance;
    cy?.autounselectify(false);

    cy.on('select', 'node', handleNodeSelect);
    cy.on('unselect', 'node', handleNodeUnSelect);
    cy.on('select', 'edge', handleEdgeSelect);
    cy.on('unselect', 'edge', handleEdgeUnSelect);

    return () => {
      cy.off('select', 'node', handleNodeSelect);
      cy.off('unselect', 'node', handleNodeUnSelect);
      cy.off('select', 'edge', handleEdgeSelect);
      cy.off('unselect', 'edge', handleEdgeUnSelect);
    };
  }, [cyInstance]);

  useEffect(() => {
    if (!cyInstance) return;
    cyInstance.edges(':selected').unselect();
    cyInstance.nodes(':selected').unselect();
    if (selectedPid == undefined) {
      return;
    }

    const cy = cyInstance;
    const processInfo = cy.getElementById(`${selectedPid}`).data() as ProcessInfo;
    setSelectedItem(processInfo);

    const target = cy.$(`#${selectedPid}`);
    target.select();
    const selectedNode = cy.$(':selected');
    console.log('animation before', target);
    if (target.length > 0) {
      // cy.nodes().unselect();


      if (selectedNode.nonempty()) {
        const pos = selectedNode.position();
        const pan = {
          x: cy.width() / 2 - pos.x * cy.zoom(),
          y: cy.height() / 2 - pos.y * cy.zoom(),
        };
        cy.animate({
          pan: pan,
          duration: 500,
          easing: 'ease-in-out' // 'linear', 'ease-in', 'ease-out', 등
        });
      }
      // cy.edges(':selected').unselect();
      let current: CollectionReturnValue | NodeSingular = selectedNode;
      while (true) {
        const incomingEdge = current.incomers('edge');
        if (incomingEdge.empty()) break;
        incomingEdge.select();
        const parentNodes = incomingEdge.sources();

        if (parentNodes.empty()) break;
        current = parentNodes.first();
      }
    }
  }, [selectedPid]);

  const reCyRef = (cy: cytoscape.Core) => {
    console.log('reCyRef', cy);
    cyRef.current = cy;
    cyRef.current.on('layoutstop', onLayoutStop);
  }

  const onLayoutStop = () => {
    console.log('layout finished');
    setCyInstance(cyRef.current);
  };

  useEffect(() => {
    makeElements().then((elements) => {
      setElements(elements);
    })
  }, []);


  if (!elements) {
    return <div>Loading...</div>;
  }

  return elements && (
    <div className="graph-pane">
      <div className="header">
        <div className="refresh">
          <Icon icon={faArrowRotateRight} onClick={() => clickRefresh()} />
        </div>
        <div className="zoom-out">
          <Icon icon={faMagnifyingGlassMinus} onClick={() => clickZoomOut()} />
        </div>
        <div className="zoom-in">
          <Icon icon={faMagnifyingGlassPlus} onClick={() => clickZoomIn()} />
        </div>
        {selectedPid && (
          <>
            <div className="zoom-max">
              <Icon icon={faMaximize} onClick={() => clickZoomMax()} />
            </div>
            <div className="zoom-min">
              <Icon icon={faMinimize} onClick={() => clickZoomMin()} />
            </div>
          </>
        )}

        {selectedItem && selectedItem.exe && (
          <div className="folder" onClick={() => shellShowItemInFolder(selectedItem.exe)}><Icon icon={faFolder} /></div>
        )}
        {selectedItem && (
          <div className="label">[{selectedItem.pid}] {selectedItem.exe || selectedItem.name || ''}</div>
        )}

      </div>
      <AutoSizer>
        {({ height, width }) => (
          // @ts-ignore
        <CytoscapeComponent
          className="graph"
          layout={coseLayoutOptions}
          elements={elements}
          style={{
            width,
            height
          }}
          stylesheet={graphStylesheet}
          cy={reCyRef}
        />
        )}
      </AutoSizer>
    </div>
  )
}

export default ProcessGraphView;

function get_info(process: ProcessInfo | undefined) {
  const ret = [
    `${process?.name}`,
    `pid: ${process?.pid}`,
    `ppid: ${process?.ppid}`,
    `mem: ${get_mem(process?.memory)}`,
    `local: ${process?.local_addr}:${process?.local_port}`,
    `remote: ${process?.remote_addr}:${process?.remote_port}`,
    // `total_read_bytes: ${process.disk_usage.total_read_bytes}`,
    // `total_write_bytes: ${process.disk_usage.total_write_bytes}`,
  ].filter((x) => !x.endsWith('undefined'));
  return ret.join('\n')
}


export async function makeElements() {
  return commands.getProcess().then((res) => {
    if (res.status == 'ok') {
      const processes = res.data;


      const pidNodes: cytoscape.ElementDefinition[] = processes.map(( process) => {
        const color = process.local_addr ? '#f4a261' : '#1f77b4';
        return {
          data: {
            id: `${process.pid}`,
            type: 'node',
            label: `${process.pid}`,
            color: color,
            info: get_info(process),
            ...process,
          },
        }
      });

      const pidEdges: cytoscape.ElementDefinition[] = processes
        .filter((process) => (process.ppid !== null && process.ppid !== undefined ))
        // .filter((process) => processes.some((p)=> p.pid === process.parent))
        .map((process) => {
          return {
            data: {
              id: `${process.ppid}-${process.pid}`,
              type: 'edge',
              source: `${process.ppid}`,
              target: `${process.pid}`,
              label: `${process.ppid}-${process.pid}`,
            },
            selectable: true
          }
        });
      return [...pidNodes, ...pidEdges];
    }
  });
}