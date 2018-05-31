/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./preview/pre.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./preview/csp.ts":
/*!************************!*\
  !*** ./preview/csp.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __webpack_require__(/*! ./settings */ "./preview/settings.ts");
const strings_1 = __webpack_require__(/*! ./strings */ "./preview/strings.ts");
/**
 * Shows an alert when there is a content security policy violation.
 */
class CspAlerter {
    constructor() {
        this.didShow = false;
        this.didHaveCspWarning = false;
        document.addEventListener('securitypolicyviolation', () => {
            this.onCspWarning();
        });
        window.addEventListener('message', (event) => {
            if (event && event.data && event.data.name === 'vscode-did-block-svg') {
                this.onCspWarning();
            }
        });
    }
    setPoster(poster) {
        this.messaging = poster;
        if (this.didHaveCspWarning) {
            this.showCspWarning();
        }
    }
    onCspWarning() {
        this.didHaveCspWarning = true;
        this.showCspWarning();
    }
    showCspWarning() {
        const strings = strings_1.getStrings();
        const settings = settings_1.getSettings();
        if (this.didShow || settings.disableSecurityWarnings || !this.messaging) {
            return;
        }
        this.didShow = true;
        const notification = document.createElement('a');
        notification.innerText = strings.cspAlertMessageText;
        notification.setAttribute('id', 'code-csp-warning');
        notification.setAttribute('title', strings.cspAlertMessageTitle);
        notification.setAttribute('role', 'button');
        notification.setAttribute('aria-label', strings.cspAlertMessageLabel);
        notification.onclick = () => {
            this.messaging.postCommand('markdown.showPreviewSecuritySelector', [settings.source]);
        };
        document.body.appendChild(notification);
    }
}
exports.CspAlerter = CspAlerter;


/***/ }),

/***/ "./preview/loading.ts":
/*!****************************!*\
  !*** ./preview/loading.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class StyleLoadingMonitor {
    constructor() {
        this.unloadedStyles = [];
        this.finishedLoading = false;
        const onStyleLoadError = (event) => {
            const source = event.target.dataset.source;
            this.unloadedStyles.push(source);
        };
        window.addEventListener('DOMContentLoaded', () => {
            for (const link of document.getElementsByClassName('code-user-style')) {
                if (link.dataset.source) {
                    link.onerror = onStyleLoadError;
                }
            }
        });
        window.addEventListener('load', () => {
            if (!this.unloadedStyles.length) {
                return;
            }
            this.finishedLoading = true;
            if (this.poster) {
                this.poster.postCommand('_markdown.onPreviewStyleLoadError', [this.unloadedStyles]);
            }
        });
    }
    setPoster(poster) {
        this.poster = poster;
        if (this.finishedLoading) {
            poster.postCommand('_markdown.onPreviewStyleLoadError', [this.unloadedStyles]);
        }
    }
}
exports.StyleLoadingMonitor = StyleLoadingMonitor;


/***/ }),

/***/ "./preview/pre.ts":
/*!************************!*\
  !*** ./preview/pre.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const csp_1 = __webpack_require__(/*! ./csp */ "./preview/csp.ts");
const loading_1 = __webpack_require__(/*! ./loading */ "./preview/loading.ts");
window.cspAlerter = new csp_1.CspAlerter();
window.styleLoadingMonitor = new loading_1.StyleLoadingMonitor();


/***/ }),

/***/ "./preview/settings.ts":
/*!*****************************!*\
  !*** ./preview/settings.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
let cachedSettings = undefined;
function getSettings() {
    if (cachedSettings) {
        return cachedSettings;
    }
    const element = document.getElementById("vscode-argdown-preview-data");
    if (element) {
        const data = element.getAttribute("data-settings");
        if (data) {
            cachedSettings = JSON.parse(data);
            return cachedSettings;
        }
    }
    throw new Error("Could not load settings");
}
exports.getSettings = getSettings;


/***/ }),

/***/ "./preview/strings.ts":
/*!****************************!*\
  !*** ./preview/strings.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function getStrings() {
    const store = document.getElementById('vscode-markdown-preview-data');
    if (store) {
        const data = store.getAttribute('data-strings');
        if (data) {
            return JSON.parse(data);
        }
    }
    throw new Error('Could not load strings');
}
exports.getStrings = getStrings;


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vcHJldmlldy9jc3AudHMiLCJ3ZWJwYWNrOi8vLy4vcHJldmlldy9sb2FkaW5nLnRzIiwid2VicGFjazovLy8uL3ByZXZpZXcvcHJlLnRzIiwid2VicGFjazovLy8uL3ByZXZpZXcvc2V0dGluZ3MudHMiLCJ3ZWJwYWNrOi8vLy4vcHJldmlldy9zdHJpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOzs7QUFHQTtBQUNBOzs7Ozs7Ozs7Ozs7OztBQ25FQTs7O2dHQUdnRzs7QUFHaEcsa0ZBQXlDO0FBQ3pDLCtFQUF1QztBQUV2Qzs7R0FFRztBQUNIO0lBTUM7UUFMUSxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2hCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQUtqQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1lBQ3pELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUM1QyxJQUFJLEtBQUssSUFBSSxL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QUssR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDdEUsSUFBSSxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hELElBQUksSUFBSSxFQUFFO1lBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Q7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDM0MsQ0FBQztBQVRELGdDQVNDIiwiZmlsZSI6InByZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3ByZXZpZXcvcHJlLnRzXCIpO1xuIiwiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmltcG9ydCB7IE1lc3NhZ2VQb3N0ZXIgfSBmcm9tICcuL21lc3NhZ2luZyc7XG5pbXBvcnQgeyBnZXRTZXR0aW5ncyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0U3RyaW5ncyB9IGZyb20gJy4vc3RyaW5ncyc7XG5cbi8qKlxuICogU2hvd3MgYW4gYWxlcnQgd2hlbiB0aGVyZSBpcyBhIGNvbnRlbnQgc2VjdXJpdHkgcG9saWN5IHZpb2xhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENzcEFsZXJ0ZXIge1xuXHRwcml2YXRlIGRpZFNob3cgPSBmYWxzZTtcblx0cHJpdmF0ZSBkaWRIYXZlQ3NwV2FybmluZyA9IGZhbHNlO1xuXG5cdHByaXZhdGUgbWVzc2FnaW5nPzogTWVzc2FnZVBvc3RlcjtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsICgpID0+IHtcblx0XHRcdHRoaXMub25Dc3BXYXJuaW5nKCk7XG5cdFx0fSk7XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuXHRcdFx0aWYgKGV2ZW50ICYmIGV2ZW50LmRhdGEgJiYgZXZlbnQuZGF0YS5uYW1lID09PSAndnNjb2RlLWRpZC1ibG9jay1zdmcnKSB7XG5cdFx0XHRcdHRoaXMub25Dc3BXYXJuaW5nKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgc2V0UG9zdGVyKHBvc3RlcjogTWVzc2FnZVBvc3Rlcikge1xuXHRcdHRoaXMubWVzc2FnaW5nID0gcG9zdGVyO1xuXHRcdGlmICh0aGlzLmRpZEhhdmVDc3BXYXJuaW5nKSB7XG5cdFx0XHR0aGlzLnNob3dDc3BXYXJuaW5nKCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBvbkNzcFdhcm5pbmcoKSB7XG5cdFx0dGhpcy5kaWRIYXZlQ3NwV2FybmluZyA9IHRydWU7XG5cdFx0dGhpcy5zaG93Q3NwV2FybmluZygpO1xuXHR9XG5cblx0cHJpdmF0ZSBzaG93Q3NwV2FybmluZygpIHtcblx0XHRjb25zdCBzdHJpbmdzID0gZ2V0U3RyaW5ncygpO1xuXHRcdGNvbnN0IHNldHRpbmdzID0gZ2V0U2V0dGluZ3MoKTtcblxuXHRcdGlmICh0aGlzLmRpZFNob3cgfHwgc2V0dGluZ3MuZGlzYWJsZVNlY3VyaXR5V2FybmluZ3MgfHwgIXRoaXMubWVzc2FnaW5nKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuZGlkU2hvdyA9IHRydWU7XG5cblx0XHRjb25zdCBub3RpZmljYXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdFx0bm90aWZpY2F0aW9uLmlubmVyVGV4dCA9IHN0cmluZ3MuY3NwQWxlcnRNZXNzYWdlVGV4dDtcblx0XHRub3RpZmljYXRpb24uc2V0QXR0cmlidXRlKCdpZCcsICdjb2RlLWNzcC13YXJuaW5nJyk7XG5cdFx0bm90aWZpY2F0aW9uLnNldEF0dHJpYnV0ZSgndGl0bGUnLCBzdHJpbmdzLmNzcEFsZXJ0TWVzc2FnZVRpdGxlKTtcblxuXHRcdG5vdGlmaWNhdGlvbi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG5cdFx0bm90aWZpY2F0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHN0cmluZ3MuY3NwQWxlcnRNZXNzYWdlTGFiZWwpO1xuXHRcdG5vdGlmaWNhdGlvbi5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0dGhpcy5tZXNzYWdpbmchLnBvc3RDb21tYW5kKCdtYXJrZG93bi5zaG93UHJldmlld1NlY3VyaXR5U2VsZWN0b3InLCBbc2V0dGluZ3Muc291cmNlXSk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vdGlmaWNhdGlvbik7XG5cdH1cbn1cbiIsIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuaW1wb3J0IHsgTWVzc2FnZVBvc3RlciB9IGZyb20gJy4vbWVzc2FnaW5nJztcblxuZXhwb3J0IGNsYXNzIFN0eWxlTG9hZGluZ01vbml0b3Ige1xuXHRwcml2YXRlIHVubG9hZGVkU3R5bGVzOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGZpbmlzaGVkTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdHByaXZhdGUgcG9zdGVyPzogTWVzc2FnZVBvc3RlcjtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRjb25zdCBvblN0eWxlTG9hZEVycm9yID0gKGV2ZW50OiBhbnkpID0+IHtcblx0XHRcdGNvbnN0IHNvdXJjZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0LnNvdXJjZTtcblx0XHRcdHRoaXMudW5sb2FkZWRTdHlsZXMucHVzaChzb3VyY2UpO1xuXHRcdH07XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcblx0XHRcdGZvciAoY29uc3QgbGluayBvZiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdjb2RlLXVzZXItc3R5bGUnKSBhcyBIVE1MQ29sbGVjdGlvbk9mPEhUTUxFbGVtZW50Pikge1xuXHRcdFx0XHRpZiAobGluay5kYXRhc2V0LnNvdXJjZSkge1xuXHRcdFx0XHRcdGxpbmsub25lcnJvciA9IG9uU3R5bGVMb2FkRXJyb3I7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLnVubG9hZGVkU3R5bGVzLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmZpbmlzaGVkTG9hZGluZyA9IHRydWU7XG5cdFx0XHRpZiAodGhpcy5wb3N0ZXIpIHtcblx0XHRcdFx0dGhpcy5wb3N0ZXIucG9zdENvbW1hbmQoJ19tYXJrZG93bi5vblByZXZpZXdTdHlsZUxvYWRFcnJvcicsIFt0aGlzLnVubG9hZGVkU3R5bGVzXSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgc2V0UG9zdGVyKHBvc3RlcjogTWVzc2FnZVBvc3Rlcik6IHZvaWQge1xuXHRcdHRoaXMucG9zdGVyID0gcG9zdGVyO1xuXHRcdGlmICh0aGlzLmZpbmlzaGVkTG9hZGluZykge1xuXHRcdFx0cG9zdGVyLnBvc3RDb21tYW5kKCdfbWFya2Rvd24ub25QcmV2aWV3U3R5bGVMb2FkRXJyb3InLCBbdGhpcy51bmxvYWRlZFN0eWxlc10pO1xuXHRcdH1cblx0fVxufSIsIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5pbXBvcnQgeyBDc3BBbGVydGVyIH0gZnJvbSAnLi9jc3AnO1xuaW1wb3J0IHsgU3R5bGVMb2FkaW5nTW9uaXRvciB9IGZyb20gJy4vbG9hZGluZyc7XG5cbmRlY2xhcmUgZ2xvYmFsIHtcblx0aW50ZXJmYWNlIFdpbmRvdyB7XG5cdFx0Y3NwQWxlcnRlcjogQ3NwQWxlcnRlcjtcblx0XHRzdHlsZUxvYWRpbmdNb25pdG9yOiBTdHlsZUxvYWRpbmdNb25pdG9yO1xuXHR9XG59XG5cbndpbmRvdy5jc3BBbGVydGVyID0gbmV3IENzcEFsZXJ0ZXIoKTtcbndpbmRvdy5zdHlsZUxvYWRpbmdNb25pdG9yID0gbmV3IFN0eWxlTG9hZGluZ01vbml0b3IoKTsiLCIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U2V0dGluZ3Mge1xuICBzb3VyY2U6IHN0cmluZztcbiAgbGluZTogbnVtYmVyO1xuICBsaW5lQ291bnQ6IG51bWJlcjtcbiAgc2Nyb2xsUHJldmlld1dpdGhFZGl0b3I/OiBib29sZWFuO1xuICBzY3JvbGxFZGl0b3JXaXRoUHJldmlldzogYm9vbGVhbjtcbiAgZGlzYWJsZVNlY3VyaXR5V2FybmluZ3M6IGJvb2xlYW47XG4gIGRvdWJsZUNsaWNrVG9Td2l0Y2hUb0VkaXRvcjogYm9vbGVhbjtcbiAgc2NhbGU/OiBudW1iZXI7XG4gIHg/OiBudW1iZXI7XG4gIHk/OiBudW1iZXI7XG4gIGRpZEluaXRpYXRlPzogYm9vbGVhbjtcbn1cblxubGV0IGNhY2hlZFNldHRpbmdzOiBQcmV2aWV3U2V0dGluZ3MgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXR0aW5ncygpOiBQcmV2aWV3U2V0dGluZ3Mge1xuICBpZiAoY2FjaGVkU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gY2FjaGVkU2V0dGluZ3M7XG4gIH1cblxuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2c2NvZGUtYXJnZG93bi1wcmV2aWV3LWRhdGFcIik7XG4gIGlmIChlbGVtZW50KSB7XG4gICAgY29uc3QgZGF0YSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1zZXR0aW5nc1wiKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgY2FjaGVkU2V0dGluZ3MgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgcmV0dXJuIGNhY2hlZFNldHRpbmdzITtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBzZXR0aW5nc1wiKTtcbn1cbiIsIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyaW5ncygpOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9IHtcblx0Y29uc3Qgc3RvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndnNjb2RlLW1hcmtkb3duLXByZXZpZXctZGF0YScpO1xuXHRpZiAoc3RvcmUpIHtcblx0XHRjb25zdCBkYXRhID0gc3RvcmUuZ2V0QXR0cmlidXRlKCdkYXRhLXN0cmluZ3MnKTtcblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG5cdFx0fVxuXHR9XG5cdHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGxvYWQgc3RyaW5ncycpO1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==