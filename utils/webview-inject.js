/** This is a template string for Metro bundling reasons.  To edit this, I highly recommend the Template Literal Editor extension for VSCode.  Messing with this complex code without syntax highlighting is a real mess.  Also, do not convert this to TypeScript. */

export default `function injectedWebviewCode(args) {
    const { color } = args;

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
}`;