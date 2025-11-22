/** This is a template string for Metro bundling reasons.  To edit this, I highly recommend the Template Literal Editor extension for VSCode.  Messing with this complex code without syntax highlighting is a real mess. */

export default `function injectedWebviewCode(args) {
    const { color, iceServers } = args;

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

    (function () {
        if (window.itchyInputInitialized) return;
        window.itchyInputInitialized = true;

        window.ReactNativeWebView.postMessage("Initializing input system...");

        const SIGNALING_MESSAGE = 'signaling-message';
        const INPUT_MESSAGE = 'forwarded-input';
        const START_STREAM_MESSAGE = 'start-stream';
        const ERROR_MESSAGE = 'webrtc-error';
        const RTC_STATE_MESSAGE = 'rtc-connection-state';

        const SIGNALING_SERVER_URL = 'wss://itchyws.micahlindley.com';
        let signalingSocket = null;

        // ICE servers configuration passed from React Native
        const pcConfig = {
            iceServers: iceServers
        };

        let peerConnection = null;
        let canvasStream = null;
        let dataChannel = null;
        let roomCode = null;

        // ---------- Peer Setup ----------
        function setupPeerConnection() {
            sendToReact("Setting up peer connection");
            peerConnection = new RTCPeerConnection(pcConfig);

            // Create data channel for metadata transmission
            dataChannel = peerConnection.createDataChannel('metadata', {
                ordered: false
            });
            setupDataChannel();

            peerConnection.onicecandidate = (event) => {
                sendToReact("onicecandidate event: " + JSON.stringify(event));
                if (event.candidate) {
                    signalingSocket?.send(JSON.stringify({
                        type: 'signal',
                        payload: { type: 'candidate', candidate: event.candidate, roomCode }
                    }));
                }
            };

            peerConnection.ondatachannel = (event) => {
                sendToReact("ondatachannel: " + JSON.stringify(event));
                // Handle additional data channels from peer if needed
            };

            peerConnection.onconnectionstatechange = () => {
                sendToReact({ type: RTC_STATE_MESSAGE, payload: peerConnection.connectionState });

                // Send project metadata when connection is established
                if (peerConnection.connectionState === 'connected') {
                    sendProjectMetadata();
                }
            };
        }

        async function startStreaming() {
            const canvas = document.querySelector('canvas');
            if (!canvas.captureStream) {
                sendToReact({ type: ERROR_MESSAGE, payload: 'Canvas captureStream not supported' });
                return;
            }

            canvasStream = canvas.captureStream(60);
            canvasStream.getTracks().forEach(track => {
                track.applyConstraints({ width: 640, height: 480 });
                peerConnection.addTrack(track, canvasStream);
            });
        }

        function setupDataChannel() {
            sendToReact("Setting up data channel");

            dataChannel.onopen = () => {
                sendToReact("Data channel opened");
                // Send project metadata when data channel opens
                sendProjectMetadata();
            };

            dataChannel.onmessage = (event) => {
                console.log("Data channel message received:", event.data);
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === INPUT_MESSAGE) {
                        handleRemoteInput(message.payload);
                    } else {
                        // Handle keystroke messages directly
                        const { key, type } = message;
                        if (key && type && (type === "keyup" || type === "keydown")) {
                            const keyboard = window.vm?.runtime?.ioDevices?.keyboard;
                            if (keyboard && keyboard._keysPressed) {
                                if (type === "keydown") {
                                    activeKeys.add(keyboard._keyStringToScratchKey(key));
                                } else if (type === "keyup") {
                                    activeKeys.delete(keyboard._keyStringToScratchKey(key));
                                }
                                updateVMKeysPressed();
                                window.ReactNativeWebView?.postMessage("Remote key: " + key + " - " + type + " | Active: [" + Array.from(activeKeys).join(", ") + "]");
                            }
                        } else if (key && type && (type === "mouse")) {
                            const mouse = window.vm?.runtime?.ioDevices?.mouse;
                            if (mouse) {
                                mouse._scratchX = message.coords.x;
                                mouse._scratchY = message.coords.y;
                                if (key == "down") {
                                    mouseButtons.add(0);
                                } else if (key == "up") {
                                    mouseButtons.clear();
                                }
                                updateVMMouseButtons();
                                window.ReactNativeWebView?.postMessage("Remote mouse: " + key + " - " + type + " | Active: [" + Array.from(mouseButtons).join(", ") + "]");
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error parsing data channel message:", err);
                    sendToReact({ type: ERROR_MESSAGE, payload: "Error parsing remote message: " + err.message });
                }
            };

            dataChannel.onerror = (err) => {
                sendToReact({ type: ERROR_MESSAGE, payload: err.message });
            };

            dataChannel.onclose = () => {
                sendToReact("Data channel closed");
            };
        }

        function sendProjectMetadata() {
            if (!dataChannel || dataChannel.readyState !== 'open') {
                sendToReact("Cannot send metadata - data channel not ready");
                return;
            }

            // Get project metadata from React Native
            sendToReact({ type: 'request-metadata' });
        }

        async function createAndSendOffer() {
            sendToReact({ type: 'sending-offer' });

            // Start streaming before creating the offer
            await startStreaming();

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            sendToReact({ type: 'offer-created', payload: JSON.stringify(peerConnection) });

            signalingSocket?.send(JSON.stringify({
                type: 'signal',
                payload: { type: 'offer', sdp: offer.sdp, sdpType: offer.type, roomCode }
            }));
        }

        async function handleSignalingMessage(msg) {
            sendToReact("Handling signaling message: " + JSON.stringify(msg));
            if (msg.sdp) {
                const desc = new RTCSessionDescription({ type: msg.type, sdp: msg.sdp });
                await peerConnection.setRemoteDescription(desc);
                sendToReact({ type: "answer-recieved", payload: JSON.stringify(peerConnection) });
            } else if (msg.candidate) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
                } catch (e) {
                    sendToReact({ type: ERROR_MESSAGE, payload: e.message });
                }
            } else {
                sendToReact({ type: ERROR_MESSAGE, payload: msg });
            }
        }

        // ---------- Input ----------
        function handleRemoteInput(input) {
            const canvas = document.querySelector('canvas');
            const event = new MouseEvent(input.eventType, {
                bubbles: true,
                clientX: input.x,
                clientY: input.y,
            });
            canvas.dispatchEvent(event);
        }

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

        // ---------- Messaging Bridge ----------
        function sendToReact(message) {
            window.ReactNativeWebView?.postMessage(JSON.stringify(message));
        }

        // ---------- WebSocket Setup ----------
        window.addEventListener("message", async (e) => {
            try {
                // Some messages are plain strings (logs) while others are JSON.
                // Try to parse JSON, but fall back to a raw wrapper when parsing fails.
                let data;
                if (typeof e.data === 'string') {
                    try {
                        data = JSON.parse(e.data);
                    } catch (err) {
                        data = { __raw: e.data };
                    }
                } else {
                    data = e.data;
                }
                const { type } = data;

                window.ReactNativeWebView.postMessage("Message received: " + type);

                // Handle project metadata transmission
                if (type === "project-metadata" && dataChannel && dataChannel.readyState === 'open') {
                    const metadataMessage = {
                        type: 'PROJECT_METADATA',
                        payload: data.metadata
                    };
                    dataChannel.send(JSON.stringify(metadataMessage));
                    sendToReact({ type: 'metadata-sent', payload: data.metadata });
                    return;
                }

                if (type == "endMultiPlaySession") {
                    // Clean up connections and reset state
                    if (dataChannel) {
                        dataChannel.close();
                        dataChannel = null;
                    }
                    if (peerConnection) {
                        peerConnection.close();
                        peerConnection = null;
                    }
                    if (signalingSocket) {
                        signalingSocket.close();
                        signalingSocket = null;
                    }
                    if (canvasStream) {
                        canvasStream.getTracks().forEach(track => track.stop());
                        canvasStream = null;
                    }

                    // Reset state variables
                    roomCode = null;
                    peerJoined = false;

                    sendToReact({ type: 'session-ended' });
                    return;
                }

                if (type == "startMultiPlaySession") {
                    window.ReactNativeWebView.postMessage("Starting MultiPlaySession: " + signalingSocket);
                    if (!!signalingSocket) return;
                    signalingSocket = new WebSocket(SIGNALING_SERVER_URL);
                    signalingSocket.onopen = () => {
                        signalingSocket.send(JSON.stringify({ type: 'create' }));
                        sendToReact({ type: 'signaling-open' });
                    };

                    signalingSocket.onmessage = async (event) => {
                        const msg = JSON.parse(event.data);

                        if (msg.type === 'room-created') {
                            roomCode = msg.payload.roomCode;
                            sendToReact({ type: 'room-created', roomCode });
                        }

                        else if (msg.type === 'peer-joined') {
                            peerJoined = true;
                            if (!peerConnection) {
                                setupPeerConnection();
                            }
                            sendToReact({ type: 'peer-joined' });
                            if (peerConnection) {
                                await createAndSendOffer();
                            }
                        }

                        else if (msg.type === 'signal') {
                            await handleSignalingMessage(msg.payload);
                        }

                        else if (msg.type === 'peer-disconnected') {
                            sendToReact({ type: 'peer-disconnected' });
                            peerConnection?.close();
                            peerConnection = null;
                            peerJoined = false;
                        }

                        else if (msg.type === 'join-failed') {
                            sendToReact({ type: ERROR_MESSAGE, payload: 'Peer failed to join' });
                        }

                        else {
                            sendToReact({ type: ERROR_MESSAGE, payload: msg.type });
                        }
                    };

                    signalingSocket.onerror = (err) => {
                        sendToReact({ type: ERROR_MESSAGE, payload: 'WebSocket error: ' + err.message });
                    };
                }
            } catch (err) {
                window.ReactNativeWebView.postMessage("Message handler error: " + err.message);
            }
        });

        const activeKeys = new Set();
        const mouseButtons = new Set();

        // Enhanced VM waiting with better iOS compatibility
        let vmCheckAttempts = 0;
        const maxVMCheckAttempts = 100; // 10 seconds max

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