sap.ui.define([], function () {
    "use strict";

    const STORAGE_KEY = "learninggame_auth_v1";

    function _saveToStorage(oData) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(oData));
        } catch (e) {
            console.warn("Konnte Session nicht speichern:", e);
        }
    }

    function _loadFromStorage() {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            if (!s) {
                return null;
            }
            return JSON.parse(s);
        } catch (e) {
            console.warn("Konnte Session nicht laden:", e);
            return null;
        }
    }

    return {
        loadSessionIntoModel: function (oUserSettingsModel) {
            const oSession = _loadFromStorage();
            if (!oSession) {
                return false;
            }
            // Nur die Felder setzen, die du brauchst
            oUserSettingsModel.setProperty("/bUserIsLoggedIn", true);
            oUserSettingsModel.setProperty("/sUsername", oSession.username);
            oUserSettingsModel.setProperty("/sApiKey", oSession.apiKey); // ggf. verschlüsselt
            return true;
        },

        saveSessionFromModel: function (oUserSettingsModel) {
            const bLoggedIn = oUserSettingsModel.getProperty("/bUserIsLoggedIn");
            if (!bLoggedIn) {
                return;
            }
            const oData = {
                username: oUserSettingsModel.getProperty("/sUsername"),
                apiKey: oUserSettingsModel.getProperty("/sApiKey") // verschlüsselt
            };
            _saveToStorage(oData);
        },

        clearSession: function () {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.warn("Konnte Session nicht löschen:", e);
            }
        }
    };
});