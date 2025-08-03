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
import {useProcessesStore} from "@/stores/processesStore.ts";
import {useTableStore} from "@/stores/tableStore.ts";
import {useTableOrderStore} from "@/stores/tableOrderStore.ts";



function ProcessGraphView() {
  const setProcesses = useProcessesStore((state) => state.setProcesses);
  const table = useTableStore((state) => state.table);
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
    if (selectedPid != undefined) {
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
    if (selectedPid != undefined) {
      cy.animate({
        zoom: cy.zoom() / 1.3,
        center: { eles: cy.elements(':selected') },
        duration: 300,
        easing: 'ease-in-out'
      });
    } else {
      cy.zoom(cy.zoom() / 1.1);
    }
  }
  const clickZoomMin = () => {
    const cy = cyInstance;
    if (!cy) return;

    if (selectedPid != undefined) {
      const canvasWidth = cy.width();
      const canvasHeight = cy.height();
      const shorterSide = Math.min(canvasWidth, canvasHeight);
      const dynamicPadding = shorterSide * 0.3;

      cy.animate({
        fit: {
          // eles: cy.$(':selected'),
          eles: cy.nodes(':selected'),
          padding: dynamicPadding,
        },
        duration: 300,
        easing: 'ease-in-out',
      });
    }

  }

  const clickZoomMax = () => {
    const cy = cyInstance;
    if (!cy) return;
    if (selectedPid != undefined) {
      const canvasWidth = cy.width();
      const canvasHeight = cy.height();
      const shorterSide = Math.min(canvasWidth, canvasHeight);
      const dynamicPadding = shorterSide * 0.1;
      cy.animate({
        fit: {
          eles: cy.elements(),
          padding: dynamicPadding
        },
        duration: 300,
        easing: 'ease-in-out'
      });
    }
  }


  const handleNodeSelect = useCallback((event: EventObject) => {
    const node = event.target;
    setSelectedPid(node.data('pid'));
  }, [])
  const handleNodeUnSelect = useCallback((_event: EventObject) => {
    setSelectedPid(undefined);
  }, [])

  const handleEdgeSelect = useCallback((_event: EventObject) => {
  }, [])
  const handleEdgeUnSelect = useCallback((_event: EventObject) => {
    setSelectedPid(undefined);
    setSelectedItem(undefined);
  }, [])


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
    if (cyRef.current) {
      cyRef.current.off('layoutstop', onLayoutStop);
      cyRef.current.off('select', 'node', handleNodeSelect);
      cyRef.current.off('unselect', 'node', handleNodeUnSelect);
      cyRef.current.off('select', 'edge', handleEdgeSelect);
      cyRef.current.off('unselect', 'edge', handleEdgeUnSelect);

    }
    cyRef.current = cy;
    cy?.autounselectify(false);
    cyRef.current.on('layoutstop', onLayoutStop);
    cyRef.current.on('select', 'node', handleNodeSelect);
    cyRef.current.on('unselect', 'node', handleNodeUnSelect);
    cyRef.current.on('select', 'edge', handleEdgeSelect);
    cyRef.current.on('unselect', 'edge', handleEdgeUnSelect);
  }

  const onLayoutStop = () => {
    console.log('layout finished');
    setCyInstance(cyRef.current);
  };

  useEffect(() => {
    commands.getProcess().then((res) => {
      if (res.status == 'ok') {
        const processes = res.data;
        setProcesses(processes);
      }
    });
  }, []);


  useEffect(() => {

    // if (processes == undefined) return;
    if (table == undefined) return;

    const pidNodes: cytoscape.ElementDefinition[] = table.map(( process) => {
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

    const pidEdges: cytoscape.ElementDefinition[] = table
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
    setElements([...pidNodes, ...pidEdges]);

    return () => {
      // console.log('cleanup');
      // setElements(undefined)
      // try {
      //
      //   cyRef.current?.stop();
      //   cyRef.current?.endBatch();
      //   cyRef.current?.removeAllListeners();
      //   cyRef.current?.destroy();
      //   cyRef.current = null;
      // } catch (e) {
      //   console.log(e);
      // }
    };
  // }, [processes]);
  }, [table]);


  if (elements == undefined) {
    return <div>Loading...</div>;
  }
  return (
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
        {(selectedPid != undefined) && (
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


