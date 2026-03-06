/** This is a template string for Metro bundling reasons.  To edit this, I highly recommend the Template Literal Editor extension for VSCode.  Messing with this code without syntax highlighting is a real mess.  Also, do not convert this to TypeScript. */

export default `function injectedWebviewCode(args) {
    const { color } = args;
    window.ReactNativeWebView.postMessage("Itchy Custom Code initialized");

    // Wait for DOM to be fully loaded before applying styles
    function applyStyles() {
        try {
            document.documentElement.style.setProperty('--ui-white', color);
            const advancedBtn = document.querySelector("img[title='Open advanced settings']");
            const fullscreenBtn = document.querySelector("span[role='button']:has(img[title='Full Screen Control'])");
            if (advancedBtn) advancedBtn.style.filter = "invert(0.7)";
            // if (fullscreenBtn) fullscreenBtn.style.filter = "contrast(0) brightness(1.4)";
            if (fullscreenBtn) fullscreenBtn.style.display = "none";
            window.ReactNativeWebView.postMessage("Styles applied successfully");
        } catch (err) {
            window.ReactNativeWebView.postMessage("Style application error: " + err.message);
        }
    }

    // Apply styles when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyStyles);
    } else {
        applyStyles();
    }

    (function() {
        if (window.itchyInputInitialized) return;
        window.itchyInputInitialized = true;
        window.ReactNativeWebView.postMessage("Initializing input system...");

        // Local input handling
        const activeKeys = new Set();
        const mouseButtons = new Set();

        function updateVMKeysPressed() {
            const keyboard = window.vm?.runtime?.ioDevices?.keyboard;
            if (keyboard) {
                // Replace the internal list directly with a copy of our current set
                keyboard._keysPressed = Array.from(activeKeys);
            }
        }

        function updateVMMouseButtons() {
            const mouse = window.vm?.runtime?.ioDevices?.mouse;
            if (mouse) {
                mouse._buttons = mouseButtons;
                if (mouseButtons.size > 0) {
                    mouse._isDown = true;
                } else {
                    mouse._isDown = false;
                }
            }
        }

        let vmCheckAttempts = 0;

        const waitForVM = setInterval(() => {
            vmCheckAttempts++;
            window.ReactNativeWebView.postMessage("VM check attempt " + vmCheckAttempts + ", VM exists: " + !!window.vm);

            const vm = window.vm;
            const keyboard = vm?.runtime?.ioDevices?.keyboard;
            const mouse = vm?.runtime?.ioDevices?.mouse;

            if (keyboard && keyboard._keysPressed && typeof keyboard._keyStringToScratchKey === 'function' && mouse && mouse._buttons) {
                clearInterval(waitForVM);
                window.ReactNativeWebView.postMessage("VM ready! Setting up input handlers...");

                // Start the message listener for keyboard input. Accept either JSON messages
                // or plain strings; if parsing fails we ignore non-JSON messages.
                window.addEventListener("message", (e) => {
                    try {
                        let data;
                        if (typeof e.data === 'string') {
                            try {
                                data = JSON.parse(e.data);
                            } catch (err) {
                                // Not JSON — ignore plain string messages for key handling
                                return;
                            }
                        } else {
                            data = e.data;
                        }

                        const { key, type } = data;

                        if (!key || !type || !['keydown', 'keyup'].includes(type)) return;

                        const scratchKey = keyboard._keyStringToScratchKey(key);
                        if (scratchKey === undefined) {
                            window.ReactNativeWebView.postMessage("Invalid key: " + key);
                            return;
                        }

                        if (type === "keydown") {
                            activeKeys.add(scratchKey);
                        } else if (type === "keyup") {
                            activeKeys.delete(scratchKey);
                        }

                        updateVMKeysPressed();
                        updateVMMouseButtons();
                        window.ReactNativeWebView.postMessage("Key event: " + key + " (" + type + ") -> " + scratchKey + " | Active: [" + Array.from(activeKeys).join(", ") + "]");
                    } catch (err) {
                        window.ReactNativeWebView.postMessage("Error parsing itchy key message: " + err.message);
                    }
                });
            }
        }, 100);
    })();
}`;