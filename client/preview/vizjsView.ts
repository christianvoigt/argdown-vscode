import * as d3 from "d3";
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
import { getPngAsString } from "./export";
import { openScaleDialog } from "./scaleDialog";

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

const loadSvg = (vizjsSvg: string = "", isUpdate: boolean = false) => {
  const svgContainer = d3.select<HTMLElement, null>("#svg-container")!;
  if (vizjsSvg) {
    svgContainer.select("*").remove();
    svgContainer.html(vizjsSvg);
  }
  const svg = svgContainer.select<SVGSVGElement>("svg");
  const svgGroup = svg.select<SVGGraphicsElement>("g");
  svg.attr("class", "map-svg");
  svg.attr("width", "100%");
  svg.attr("height", "100%");
  svg.attr("viewBox", null);
  var zoom = d3.zoom<SVGSVGElement, null>().on("zoom", function() {
    // eslint-disable-next-line
    svgGroup.attr("transform", d3.event.transform);
    scale = d3.event.transform.k;
    translateX = d3.event.transform.x;
    translateY = d3.event.transform.y;
    sendDidChangeZoom();
  });
  svg.call(zoom);
  const svgNode: SVGElement = svg!.node() as SVGElement;
  const svgSize = svgNode.getBoundingClientRect();
  const groupNode: SVGGraphicsElement = svgGroup!.node() as SVGGraphicsElement;
  const groupSize = groupNode.getBBox();
  const initialScale = scale;
  const initialX =
    !isUpdate && !settings.didInitiate
      ? (svgSize.width - groupSize.width * initialScale) / 2
      : translateX;
  const initialY =
    !isUpdate && !settings.didInitiate
      ? (svgSize.height + groupSize.height * initialScale) / 2
      : translateY;
  svg
    .transition()
    .duration(0)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(initialX, initialY).scale(initialScale)
    );
  svgGroup.attr("height", groupSize.height * initialScale + 40);
};

onceDocumentLoaded(() => {
  loadSvg();
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
      case "onDidChangeTextEditorSelection":
        marker.onDidChangeTextEditorSelection(event.data.line);
        break;
      case "onDidChangeTextDocument":
        loadSvg(event.data.svg, true);
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
