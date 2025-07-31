import cytoscape from 'cytoscape';
import {FontAwesomeIcon as Icon} from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMaximize, faMinimize
} from "@fortawesome/free-solid-svg-icons";
import React from "react";


export const coseLayoutOptions: cytoscape.CoseLayoutOptions = {
  // name: "cose",
  // // refresh?: number
  // // randomize?: boolean
  // componentSpacing: 10,
  // // nodeRepulsion?(node: any): number
  // // nodeOverlap: 200,
  // // idealEdgeLength?(edge: any): number
  // // edgeElasticity?(edge: any): number
  //
  // edgeElasticity: 100,
  // nestingFactor: 1,
  // fit: true,
  // animate: true,
  // padding: 50,
  // nodeOverlap: 150,
  // idealEdgeLength: 100,
  // gravity: 0.05,
  // numIter: 1000,

  name: 'cose',
  nodeRepulsion: 1000,           // 노드 간 거리 강하게 설정
  edgeElasticity: 400,            // 엣지가 당기는 힘
  idealEdgeLength: 400,
  gravity: 80,
  avoidOverlap: true,
  nodeDimensionsIncludeLabels: true,
  spacingFactor: 1.2,
  animate: true,
  animationDuration: 500,
}

export const breadthFirstLayoutOptions: cytoscape.BreadthFirstLayoutOptions = {
  name: 'breadthfirst',
  directed: true,
  padding: 200,
  circle: true,
  spacingFactor: 1.5,
  nodeDimensionsIncludeLabels: true,
  avoidOverlap: true,
  // animate: true,
  // animationDuration: 500,
};

export const concentricLayoutOptions: cytoscape.ConcentricLayoutOptions = {
  name: 'concentric',
  clockwise: true,
  equidistant: true,
  minNodeSpacing: 100,
}

export const gridLayoutOptions: cytoscape.GridLayoutOptions= {
  name: 'grid',
  avoidOverlap: true,
  condense: true,
  rows: 10,
  cols: 10,
  fit: true,
  padding: 100,
  spacingFactor: 1.5,
  // boundingBox: undefined,
  // position: undefined,
  animate: true,
  animationDuration: 500,
  // animationEasing: undefined,
}


export const graphStylesheet: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      label: 'data(info)',
      'text-valign': 'center',
      'text-halign': 'center',
      'background-color': 'data(color)',
      color: '#000',
      width: 150,
      height: 150,
      'text-wrap': 'wrap',
      'font-size': 20,
    }
  },
  {
    selector: 'node:selected',
    style: {
      'background-color': '#a63131',
      'border-color': '#af0707',
      'border-width': 10,
    }
  },
  {
    selector: 'edge',
    style: {
      width: 6,
      'curve-style': 'bezier',
      'line-color': '#c6b6b6',
      'target-arrow-color': '#e83d3d',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.5
    }
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#a63131',
      'target-arrow-color': '#af0707',
      'width': 10,
      'arrow-scale': 2
    }
  },

];
