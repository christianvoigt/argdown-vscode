import { ActiveLineMarker } from "./activeLineMarker";
import { onceDocumentLoaded } from "./events";
import { createPosterForVsCode } from "./messaging";
import {
  getEditorLineNumberForPageOffset,
  scrollToRevealSourceLine
} from "./scroll-sync";
import { getSettings } from "./settings";
import throttle = require("lodash.throttle");
import { initMenu } from "./menu";
import * as dagreD3 from "dagre-d3";
import * as d3 from "d3";
import { getSvgForExport, getPngAsString } from "./export";
import { openScaleDialog } from "./scaleDialog";

declare function require(path: string): string;
const dagreCss = require("!raw-loader!./dagre.css");
const dagreCssHtml = '<style type="text/css">' + dagreCss + "</style>";

declare var acquireVsCodeApi: any;

var scrollDisabled = true;
const marker = new ActiveLineMarker();
const settings = getSettings();

let scale = settings.hasOwnProperty("scale") ? settings.scale! : 0.75;
let translateX = settings.hasOwnProperty("x") ? settings.x! : 0;
let translateY = settings.hasOwnProperty("y") ? settings.y! : 0;
const sendDidChangeZoom = throttle(() => {
  messagePoster.postMessage("didChangeZoom", {
    scale: scale,
    x: translateX,
    y: translateY
  });
}, 50);

const vscode = acquireVsCodeApi();
vscode.postMessage({});

const messagePoster = createPosterForVsCode(vscode);
initMenu(messagePoster);

window.cspAlerter.setPoster(messagePoster);
window.styleLoadingMonitor.setPoster(messagePoster);
const rankDir: string = "BT";
const rankSep: number = 50;
const nodeSep: number = 70;

const getSvgEl = () => {
  return <SVGSVGElement>(<any>document.getElementById("dagre-svg")!);
};

const addNode = (
  node: any,
  g: dagreD3.graphlib.Graph,
  tagsDictionary: any,
  currentGroup: any = null
) => {
  const nodeProperties: dagreD3.Label = {
    labelType: "html",
    class: node.type + "",
    paddingBottom: 0,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    label: "",
    clusterLabelPos: "center"
  };
  nodeProperties.label = '<div class="node-label">';
  if (node.labelTitle) {
    nodeProperties.label += "<h3>" + node.labelTitle + "</h3>";
  }
  // eslint-disable-next-line
  if (
    node.labelText &&
    (node.type === "statement" || node.type === "argument")
  ) {
    nodeProperties.label += "<p>" + node.labelText + "</p>";
  }
  if (node.tags && tagsDictionary) {
    for (let tag of node.tags) {
      nodeProperties.class += " ";
      // eslint-disable-next-line
      nodeProperties.class += tagsDictionary[tag].cssClass;
    }
  }
  nodeProperties.label += "</div>";

  if (node.type === "group") {
    nodeProperties.clusterLabelPos = "top";
    nodeProperties.class += " level-" + node.level;
  }
  g.setNode(node.id, nodeProperties);
  if (currentGroup) {
    g.setParent(node.id, currentGroup.id);
  }
  if (node.type === "group") {
    for (let child of node.nodes) {
      addNode(child, g, tagsDictionary, node);
    }
  }
};

const generateSvg = (argdownData: any, isUpdate: boolean = false): void => {
  const map = argdownData.map;
  const tagsDictionary = argdownData.tagsDictionary;
  // Create the input graph
  const g: dagreD3.graphlib.Graph = new dagreD3.graphlib.Graph({
    compound: true
  })
    .setGraph({
      rankdir: rankDir,
      ranksep: rankSep,
      nodesep: nodeSep,
      marginx: 20,
      marginy: 20
    })
    .setDefaultEdgeLabel(function() {
      return {};
    });

  for (let node of map.nodes) {
    addNode(node, g, tagsDictionary);
  }

  for (let edge of map.edges) {
    g.setEdge(edge.from, edge.to, { class: edge.type });
  }

  const nodes = g.nodes();

  for (let v of nodes) {
    const node = g.node(v);
    // Round the corners of the nodes
    node.rx = node.ry = 5;
  }

  // Create the renderer
  const render = new dagreD3.render(); // eslint-disable-line new-cap

  // const layout = dagreD3.layout().rankSep(50).rankDir('BT')

  // Set up an SVG group so that we can translate the final graph.
  const svg = d3.select<SVGSVGElement, null>("#dagre-svg");
  svg.selectAll("*").remove();

  svg.append("g");
  const svgGroup = svg.select<SVGGraphicsElement>("g");
  svgGroup.attr("class", "dagre");

  var zoom = d3.zoom<SVGSVGElement, null>().on("zoom", function() {
    // eslint-disable-next-line
    svgGroup.attr("transform", d3.event.transform);
    scale = d3.event.transform.k;
    translateX = d3.event.transform.x;
    translateY = d3.event.transform.y;
    sendDidChangeZoom();
  });
  svg.call(zoom);

  // Run the renderer. This is what draws the final graph.
  render(svgGroup as any, g);
  // renderer.layout(layout).run(svgGroup, g)
  // Center the graph
  let getSvgWidth = function() {
    let positionInfo = svg.node()!.getBoundingClientRect();
    return positionInfo.width;
  };
  const initialScale = scale;
  const initialX =
    !isUpdate && !settings.didInitiate
      ? (getSvgWidth() - g.graph().width * initialScale) / 2
      : translateX;
  const initialY = !isUpdate && !settings.didInitiate ? 20 : translateY;
  svg
    .transition()
    .duration(0)
    .call(
      zoom.transform,
      // eslint-disable-next-line
      d3.zoomIdentity.translate(initialX, initialY).scale(initialScale)
    );
  svgGroup.attr("height", g.graph().height * initialScale + 40);
};

onceDocumentLoaded(() => {
  const argdownDataEl = document.getElementById("argdown-json-data");
  if (!argdownDataEl) {
    return;
  }
  const argdownData = JSON.parse(argdownDataEl.dataset.argdown!);
  generateSvg(argdownData);
});

const onUpdateView = (() => {
  const doScroll = throttle((line: number) => {
    scrollDisabled = true;
    scrollToRevealSourceLine(line);
  }, 50);

  return (line: number, settings: any) => {
    if (!isNaN(line)) {
      settings.line = line;
      doScroll(line);
    }
  };
})();

window.addEventListener(
  "resize",
  () => {
    scrollDisabled = true;
  },
  true
);

window.addEventListener(
  "message",
  event => {
    if (event.data.source !== settings.source) {
      return;
    }

    switch (event.data.type) {
      case "onDidChangeTextDocument":
        const argdownData = JSON.parse(event.data.json);
        generateSvg(argdownData, true);
        break;
      case "onDidChangeTextEditorSelection":
        marker.onDidChangeTextEditorSelection(event.data.line);
        break;

      case "updateView":
        onUpdateView(event.data.line, settings);
        break;
    }
  },
  false
);

document.addEventListener("dblclick", event => {
  if (!settings.doubleClickToSwitchToEditor) {
    return;
  }

  // Ignore clicks on links
  for (
    let node = event.target as HTMLElement;
    node;
    node = node.parentNode as HTMLElement
  ) {
    if (node.tagName === "A") {
      return;
    }
  }

  const offset = event.pageY;
  const line = getEditorLineNumberForPageOffset(offset);
  if (typeof line === "number" && !isNaN(line)) {
    messagePoster.postMessage("didClick", { line: Math.floor(line) });
  }
});

document.addEventListener(
  "click",
  event => {
    if (!event) {
      return;
    }

    let node: any = event.target;
    while (node) {
      if (node.tagName && node.tagName === "A" && node.href) {
        if (node.dataset.command) {
          const command = node.dataset.command;
          if (command === "argdown.exportContentToDagreSvg") {
            var svgString = getSvgForExport(getSvgEl(), dagreCssHtml);
            messagePoster.postCommand(command, [settings.source, svgString]);
          } else if (command === "argdown.exportContentToDagrePng") {
            openScaleDialog(scale => {
              getPngAsString(getSvgEl(), scale, dagreCssHtml, pngString => {
                messagePoster.postCommand(command, [
                  settings.source,
                  pngString
                ]);
              });
            });
          } else if (command === "argdown.exportContentToDagrePdf") {
            var svgString = getSvgForExport(getSvgEl(), dagreCssHtml);
            messagePoster.postCommand(command, [settings.source, svgString]);
          }
          break;
        }
        if (node.getAttribute("href").startsWith("#")) {
          break;
        }
        if (
          node.href.startsWith("file://") ||
          node.href.startsWith("vscode-resource:")
        ) {
          const [path, fragment] = node.href
            .replace(/^(file:\/\/|vscode-resource:)/i, "")
            .split("#");
          messagePoster.postCommand("_markdown.openDocumentLink", [
            { path, fragment }
          ]);
          event.preventDefault();
          event.stopPropagation();
          break;
        }
        break;
      }
      node = node.parentNode;
    }
  },
  true
);

if (settings.scrollEditorWithPreview) {
  window.addEventListener(
    "scroll",
    throttle(() => {
      if (scrollDisabled) {
        scrollDisabled = false;
      } else {
        const line = getEditorLineNumberForPageOffset(window.scrollY);
        if (typeof line === "number" && !isNaN(line)) {
          messagePoster.postMessage("revealLine", { line });
        }
      }
    }, 50)
  );
}
