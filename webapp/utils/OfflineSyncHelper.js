sap.ui.define([], function () {
    "use strict";

    const c_sQUEUE_KEY = "SupabaseOfflineQueue";
    const c_nRETRY_INTERVAL_MS = 30000; // 30 seconds

    let _oUserSettingsModel = null;
    let _nIntervalId = null;
    let _bIsProcessing = false;

    function _getQueue() {
        const sQueue = localStorage.getItem(c_sQUEUE_KEY);
        if (sQueue) {
            try {
                return JSON.parse(sQueue);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    function _saveQueue(aQueue) {
        localStorage.setItem(c_sQUEUE_KEY, JSON.stringify(aQueue));
    }

    function _updateNetworkStatus(bIsOnline) {
        if (_oUserSettingsModel) {
            _oUserSettingsModel.setProperty("/bIsNetworkOnline", bIsOnline);
        }
    }

    async function _processQueue() {
        if (_bIsProcessing) {
            return;
        }

        if (!navigator.onLine) {
            _updateNetworkStatus(false);
            return;
        }

        _updateNetworkStatus(true);
        _bIsProcessing = true;

        let aQueue = _getQueue();
        if (aQueue.length === 0) {
            _bIsProcessing = false;
            return;
        }

        let aRemainingQueue = [];

        for (let i = 0; i < aQueue.length; i++) {
            const oRequest = aQueue[i];
            try {
                const oResponse = await fetch(oRequest.sUrl, {
                    method: oRequest.sMethod,
                    headers: oRequest.oHeaders,
                    body: oRequest.sBody
                });

                if (!oResponse.ok) {
                    // If it's a 4xx or 5xx error that is not a network error, we probably shouldn't retry it infinitely, 
                    // but for simplicity we keep it in queue if it fails, or maybe just drop it if it's a 4xx.
                    // Let's keep it in the queue for any failure to be safe, or drop if it's a bad request.
                    // For now, if fetch throws, it goes to catch. If response is not ok, we keep it in the queue.
                    aRemainingQueue.push(oRequest);
                } else {
                    console.log("OfflineSyncHelper: Request erfolgreich aus der Warteschlange abgearbeitet ->", oRequest.sUrl);
                }
            } catch (error) {
                // Network error, keep in queue
                aRemainingQueue.push(oRequest);
            }
        }

        _saveQueue(aRemainingQueue);
        
        if (aQueue.length > 0) {
            if (aRemainingQueue.length === 0) {
                console.log("OfflineSyncHelper: Alle Einträge erfolgreich abgearbeitet. Liste ist nun leer.");
            } else {
                console.log("OfflineSyncHelper: Verbleibende Einträge in der Liste:", aRemainingQueue);
            }
        }

        _bIsProcessing = false;
    }

    return {
        initSync: function (oUserSettingsModel) {
            _oUserSettingsModel = oUserSettingsModel;

            window.addEventListener("online", function () {
                _updateNetworkStatus(true);
                _processQueue();
            });

            window.addEventListener("offline", function () {
                _updateNetworkStatus(false);
            });

            // Initial check
            _updateNetworkStatus(navigator.onLine);

            if (_nIntervalId) {
                clearInterval(_nIntervalId);
            }

            _nIntervalId = setInterval(_processQueue, c_nRETRY_INTERVAL_MS);
            
            // Try to process immediately on init
            _processQueue();
        },

        enqueueRequest: function (sUrl, sMethod, oHeaders, sBody) {
            let aQueue = _getQueue();
            aQueue.push({
                sUrl: sUrl,
                sMethod: sMethod,
                oHeaders: oHeaders,
                sBody: sBody,
                nTimestamp: Date.now()
            });
            _saveQueue(aQueue);
        }
    };
});
