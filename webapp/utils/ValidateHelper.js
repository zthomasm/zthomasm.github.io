sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function (JSONModel) {
    "use strict";

    // SHA-256 Helper (Web Crypto API)
    async function _hashSha256(sValue) {
        const encoder = new TextEncoder();
        const data = encoder.encode(sValue);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data); // ArrayBuffer
        const hashArray = Array.from(new Uint8Array(hashBuffer));      // Byte-Array
        const hashHex = hashArray
            .map(function (b) {
                return b.toString(16).padStart(2, "0");
            })
            .join("");
        return hashHex;
    }

    return {
        /**
         * Validiert Login-Daten.
         * @param {sap.ui.model.json.JSONModel} oUserSettingsModel  Named model "userSettings"
         * @param {sap.ui.model.json.JSONModel} oAllUsersModel      Model aus UserSettings.allUsers()
         * @param {string} sUsernameEingabe
         * @param {string} sApiKeyEingabe
         * @returns {Promise<boolean>} true = Login ok, false = Login fail
         */
        validateLogin: async function (oUserSettingsModel, oAllUsersModel, sUsernameEingabe, sApiKeyEingabe) {
            if (!sUsernameEingabe || !sApiKeyEingabe) {
                return false;
            }

            // 1) API Key hashen
            const sHash = await _hashSha256(sApiKeyEingabe); // hex string [web:60][web:63]

            // 2) AllUsers durchsuchen
            const oAllUsersData = oAllUsersModel.getData();  // { User0001: {...}, User0002: {...} }
            let oMatchedUser = null;

            Object.keys(oAllUsersData).some(function (sKey) {
                const oUser = oAllUsersData[sKey];
                const bUserMatches = oUser.sUsername === sUsernameEingabe;
                const bHashMatches = oUser.sApiKeyHashed === sHash;

                if (bUserMatches && bHashMatches) {
                    oMatchedUser = oUser;
                    return true; // break
                }
                return false;
            });

            if (!oMatchedUser) {
                // kein Treffer
                return false;
            }

            // 3) userSettings setzen
            oUserSettingsModel.setProperty("/sUsername", oMatchedUser.sUsername);
            oUserSettingsModel.setProperty("/sApiKey", sApiKeyEingabe);
            oUserSettingsModel.setProperty("/sApiKeyHashed", sHash);
            oUserSettingsModel.setProperty("/bUserIsLoggedIn", true);

            return true;
        }
    };
});