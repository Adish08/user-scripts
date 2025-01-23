// ==UserScript==
// @name         Hover Link Preview - Zen Browser
// @namespace    https://adish08.github.io
// @version      2.4
// @description  Automatically triggers Alt+Click preview after hovering on links for 5 seconds **NOTE: ONLY WORKS WITH ZEN BROWSER
// @author       Adish Sagarawat
// @license      MIT
// @icon         https://miro.medium.com/v2/0*oa0XcvM99Y5clDsj.png
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    const DEFAULTS = {
        hoverDelay: 3000,
        animationTime: 2000,
        animationSize: 24,
        strokeWidth: 5,
        circleColor: '#007bff',
        bgColor: '#ffffff',
    };

    const SETTINGS = {
        hoverDelay: GM_getValue('hoverDelay', DEFAULTS.hoverDelay),
        animationTime: GM_getValue('animationTime', DEFAULTS.animationTime),
        animationSize: GM_getValue('animationSize', DEFAULTS.animationSize),
        strokeWidth: GM_getValue('strokeWidth', DEFAULTS.strokeWidth),
        circleColor: GM_getValue('circleColor', DEFAULTS.circleColor),
        bgColor: GM_getValue('bgColor', DEFAULTS.bgColor),
    };

    GM_registerMenuCommand('⚙️ Configure Link Preview', showSettingsDialog);

    let animationStyle;
    const linkStates = new WeakMap();
    let mutationObserver;

    function initialize() {
        animationStyle = document.createElement('style');
        document.head.appendChild(animationStyle);
        updateAnimationStyle();
        updateLinkListeners();
        setupMutationObserver();
    }

    function setupMutationObserver() {
        mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'A') checkAndAddListener(node);
                        node.querySelectorAll('a').forEach(checkAndAddListener);
                    }
                });
            });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    function checkAndAddListener(link) {
        if (isValidLink(link) && !linkStates.has(link)) {
            link.addEventListener('mouseenter', handleMouseEnter);
            link.addEventListener('mouseleave', handleMouseLeave);
        }
    }

    function updateLinkListeners() {
        document.querySelectorAll('a[href]').forEach((link) => {
            if (isValidLink(link)) {
                link.removeEventListener('mouseenter', handleMouseEnter);
                link.removeEventListener('mouseleave', handleMouseLeave);
                checkAndAddListener(link);
            }
        });
    }

    function isValidLink(element) {
        const role = element.getAttribute('role');
        return element.href &&
            !element.href.startsWith('javascript:') &&
            element.tagName.toLowerCase() === 'a' &&
            (!role || role !== 'button');
    }

    function createAnimationElement(link, clientX, clientY) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", SETTINGS.animationSize);
        svg.setAttribute("height", SETTINGS.animationSize);
        svg.style.position = "fixed";
        svg.style.pointerEvents = "none";
        svg.style.zIndex = "9999";
        svg.style.left = `${clientX}px`;
        svg.style.top = `${clientY}px`;

        const radius = (SETTINGS.animationSize - SETTINGS.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bgCircle.setAttribute("cx", "50%");
        bgCircle.setAttribute("cy", "50%");
        bgCircle.setAttribute("r", radius);
        bgCircle.setAttribute("fill", "none");
        bgCircle.setAttribute("stroke", SETTINGS.bgColor);
        bgCircle.setAttribute("stroke-width", SETTINGS.strokeWidth);

        const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        progressCircle.setAttribute("cx", "50%");
        progressCircle.setAttribute("cy", "50%");
        progressCircle.setAttribute("r", radius);
        progressCircle.setAttribute("fill", "none");
        progressCircle.setAttribute("stroke", SETTINGS.circleColor);
        progressCircle.setAttribute("stroke-width", SETTINGS.strokeWidth);
        progressCircle.setAttribute("stroke-dasharray", circumference);
        progressCircle.setAttribute("stroke-dashoffset", circumference);
        progressCircle.setAttribute("transform", "rotate(-90 50% 50%)");
        progressCircle.style.animation = `circle-progress ${SETTINGS.animationTime}ms linear forwards`;

        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);

        return { svg, progressCircle };
    }

    function handleMouseEnter(event) {
        const link = event.target;
        const clientX = event.clientX;
        const clientY = event.clientY;

        const state = linkStates.get(link) || {};

        state.hoverTimeout = setTimeout(() => {
            const { svg, progressCircle } = createAnimationElement(link, clientX, clientY);
            document.body.appendChild(svg);

            const animationEndHandler = () => {
                triggerAltClick(link);
                cleanup();
            };

            const cleanup = () => {
                svg.remove();
                progressCircle.removeEventListener('animationend', animationEndHandler);
                linkStates.delete(link);
            };

            progressCircle.addEventListener('animationend', animationEndHandler);

            state.animationElements = { svg, progressCircle };
            linkStates.set(link, state);
        }, SETTINGS.hoverDelay);

        linkStates.set(link, state);
    }

    function handleMouseLeave(event) {
        const link = event.target;
        const state = linkStates.get(link);
        if (state?.hoverTimeout) {
            clearTimeout(state.hoverTimeout);
            if (state.animationElements) {
                state.animationElements.svg.remove();
            }
            linkStates.delete(link);
        }
    }

    function triggerAltClick(element) {
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            altKey: true,
        });
        element.dispatchEvent(event);
    }

    function updateAnimationStyle() {
        const radius = (SETTINGS.animationSize - SETTINGS.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        animationStyle.textContent = `
            @keyframes circle-progress {
                from { stroke-dashoffset: ${circumference}; }
                to { stroke-dashoffset: 0; }
            }
        `;
    }

    function showSettingsDialog() {
        const settingsHtml = `
            <div style="display: flex; flex-direction: column; gap: 10px; width: 300px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Hover Delay (ms):</span>
                    <input type="number" id="hoverDelay" value="${SETTINGS.hoverDelay}" style="width: 100px; margin-left: 10px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Animation Time (ms):</span>
                    <input type="number" id="animationTime" value="${SETTINGS.animationTime}" style="width: 100px; margin-left: 10px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Circle Size (px):</span>
                    <input type="number" id="animationSize" value="${SETTINGS.animationSize}" style="width: 100px; margin-left: 10px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Stroke Width (px):</span>
                    <input type="number" id="strokeWidth" value="${SETTINGS.strokeWidth}" style="width: 100px; margin-left: 10px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Circle Color:</span>
                    <input type="color" id="circleColor" value="${SETTINGS.circleColor}" style="margin-left: 10px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Background Color:</span>
                    <input type="color" id="bgColor" value="${SETTINGS.bgColor}" style="margin-left: 10px;">
                </label>
                <button id="saveSettings" style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Save
                </button>
            </div>
        `;

        const settingsDiv = document.createElement('div');
        settingsDiv.innerHTML = settingsHtml;
        settingsDiv.style.position = 'fixed';
        settingsDiv.style.top = '50px';
        settingsDiv.style.right = '50px';
        settingsDiv.style.zIndex = '10000';
        settingsDiv.style.backgroundColor = '#ffffff';
        settingsDiv.style.padding = '20px';
        settingsDiv.style.border = '1px solid #ccc';
        settingsDiv.style.borderRadius = '8px';
        settingsDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        document.body.appendChild(settingsDiv);

        settingsDiv.querySelector('#saveSettings').addEventListener('click', () => {
            GM_setValue('hoverDelay', parseInt(settingsDiv.querySelector('#hoverDelay').value));
            GM_setValue('animationTime', parseInt(settingsDiv.querySelector('#animationTime').value));
            GM_setValue('animationSize', parseInt(settingsDiv.querySelector('#animationSize').value));
            GM_setValue('strokeWidth', parseInt(settingsDiv.querySelector('#strokeWidth').value));
            GM_setValue('circleColor', settingsDiv.querySelector('#circleColor').value);
            GM_setValue('bgColor', settingsDiv.querySelector('#bgColor').value);
            alert('Settings saved! Refresh the page to apply changes.');
            settingsDiv.remove();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
