import * as d3 from "d3";
import { onceDocumentLoaded } from "./events";
import { createPosterForVsCode } from "./messaging";
import { getSettings, IPreviewSettings } from "./settings";
import throttle = require("lodash.throttle");
import { initMenu } from "./menu";
import { getPngAsString } from "./export";
import { openScaleDialog } from "./scaleDialog";

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();
vscode.postMessage({});

const messagePoster = createPosterForVsCode(vscode);
initMenu(messagePoster);

window.cspAlerter.setPoster(messagePoster);
window.styleLoadingMonitor.setPoster(messagePoster);

const settings = getSettings();
interface IVizjsViewState {
  settings: IPreviewSettings;
  scale: number;
  x: number;
  y: number;
  svg?: d3.Selection<SVGSVGElement, null, HTMLElement, any>;
  zoom?: d3.ZoomBehavior<SVGSVGElement, null>;
  graphSize: {
    width: number;
    height: number;
  };
}
const state: IVizjsViewState = {
  settings: settings,
  scale: settings.hasOwnProperty("scale") ? settings.scale! : 0.75,
  x: settings.hasOwnProperty("x") ? settings.x! : 0,
  y: settings.hasOwnProperty("y") ? settings.y! : 0,
  graphSize: {
    width: 0,
    height: 0
  }
};

const sendDidChangeZoom = throttle((state: IVizjsViewState) => {
  messagePoster.postMessage("didChangeZoom", {
    scale: state.scale,
    x: state.x,
    y: state.y
  });
}, 50);

const loadSvg = (
  vizjsSvg: string = "",
  state: IVizjsViewState,
  isUpdate: boolean = false
) => {
  const svgContainer = d3.select<HTMLElement, null>("#svg-container")!;
  if (vizjsSvg) {
    svgContainer.select("*").remove();
    svgContainer.html(vizjsSvg);
  }
  state.svg = svgContainer.select<SVGSVGElement>("svg");
  const svgGroup = state.svg.select<SVGGraphicsElement>("g");
  state.svg.attr("class", "map-svg");
  state.svg.attr("width", "100%");
  state.svg.attr("height", "100%");
  state.svg.attr("viewBox", null);
  state.zoom = d3.zoom<SVGSVGElement, null>().on("zoom", function() {
    // eslint-disable-next-line
    svgGroup.attr("transform", d3.event.transform);
    state.scale = d3.event.transform.k;
    state.x = d3.event.transform.x;
    state.y = d3.event.transform.y;
    sendDidChangeZoom(state);
  });
  // remove double click listener
  state.svg.call(state.zoom).on("dblclick.zoom", null);
  const groupNode: SVGGraphicsElement = svgGroup!.node() as SVGGraphicsElement;
  const bBox = groupNode.getBBox();
  state.graphSize.width = bBox.width;
  state.graphSize.height = bBox.height;
  if (!isUpdate && !settings.didInitiate) {
    showAllAndCenterMap(state);
  } else {
    setZoom(state.x, state.y, state.scale, state);
  }
  svgGroup.attr("height", state.graphSize.height * state.scale + 40);
};
const showAllAndCenterMap = (state: IVizjsViewState) => {
  if (!state.svg) {
    return;
  }
  let positionInfo = state.svg.node()!.getBoundingClientRect();
  const xScale = positionInfo.width / state.graphSize.width;
  const yScale = positionInfo.height / state.graphSize.height;
  const scale = Math.min(xScale, yScale);
  console.log("positionInfo.height: " + positionInfo.height);
  console.log("graphSize.height: " + state.graphSize.height);
  console.log("y: " + (positionInfo.height - state.graphSize.height) / 2);
  console.log("scale: " + scale);
  const x = (positionInfo.width - state.graphSize.width * scale) / 2;
  const scaledHeight = state.graphSize.height * scale;
  const y = scaledHeight + (positionInfo.height - scaledHeight) / 2;
  setZoom(x, y, scale, state);
};
const setZoom = (
  x: number,
  y: number,
  scale: number,
  state: IVizjsViewState
) => {
  if (!state.svg || !state.zoom) {
    return;
  }
  state.svg
    .transition()
    .duration(0)
    .call(
      state.zoom.transform,
      // eslint-disable-next-line
      d3.zoomIdentity.translate(x, y).scale(scale)
    );
};

onceDocumentLoaded(() => {
  loadSvg("", state);
});

window.addEventListener(
  "message",
  event => {
    if (event.data.source !== settings.source) {
      return;
    }

    switch (event.data.type) {
      case "onDidChangeTextDocument":
        loadSvg(event.data.svg, state, true);
        break;
    }
  },
  false
);

document.addEventListener("dblclick", event => {
  if (!state.settings.doubleClickToSwitchToEditor) {
    return;
  }
  // Ignore clicks on links
  for (
    let node = event.target as HTMLElement;
    node;
    node = node.parentNode as HTMLElement
  ) {
    if (node.tagName && node.tagName === "g" && node.classList) {
      if (node.classList.contains("node")) {
        const id = node.id;
        messagePoster.postMessage("didSelectMapNode", { id });
      }
    } else if (node.tagName === "A") {
      return;
    }
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
          if (command === "argdown.exportDocumentToVizjsSvg") {
            messagePoster.postCommand(command, [settings.source]);
          } else if (command === "argdown.exportDocumentToVizjsPdf") {
            messagePoster.postCommand(command, [settings.source]);
          } else if (command === "argdown.exportContentToVizjsPng") {
            openScaleDialog(scale => {
              var svgContainer = document.getElementById("svg-container")!;
              var svgEl: SVGSVGElement = svgContainer.getElementsByTagName(
                "svg"
              )[0];
              getPngAsString(svgEl, scale, "", pngString => {
                messagePoster.postCommand(command, [
                  settings.source,
                  pngString
                ]);
              });
            });
          }
          event.preventDefault();
          event.stopPropagation();
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
