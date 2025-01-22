// ==UserScript==
// @name         Auto Link Preview
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically triggers Alt+Click preview after hovering on links for 2 seconds
// @author       Adish Sagarawat
// @match        *://*/*
// @icon         
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let hoverTimer = null;
    let currentLink = null;

    // Function to simulate Alt+Click
    function simulateAltClick(element) {
        const event = new MouseEvent('click', {
            altKey: true,
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(event);
    }

    // Handle mouse enter on links
    function handleLinkHover(e) {
        const link = e.target.closest('a');
        if (!link) return;

        currentLink = link;
        clearTimeout(hoverTimer);

        hoverTimer = setTimeout(() => {
            simulateAltClick(link);
        }, 2000); // 2 seconds delay
    }

    // Handle mouse leave
    function handleLinkLeave() {
        clearTimeout(hoverTimer);
        currentLink = null;
    }

    // Add event listeners to existing links
    document.addEventListener('mouseover', handleLinkHover);
    document.addEventListener('mouseout', handleLinkLeave);

    // Handle dynamically added links using MutationObserver
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const links = node.getElementsByTagName('a');
                    Array.from(links).forEach(link => {
                        link.addEventListener('mouseover', handleLinkHover);
                        link.addEventListener('mouseout', handleLinkLeave);
                    });
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
