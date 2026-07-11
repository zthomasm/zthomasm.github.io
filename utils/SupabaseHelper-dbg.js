sap.ui.define([
    "learninggame/utils/OfflineSyncHelper"
], function (OfflineSyncHelper) {
    "use strict";

    const SUPABASE_URL = "https://sycksmhhgsnjxtvkpotm.supabase.co";
    const TABLE_NAME = "LH_DB_0001";

    function _buildHeaders(sSupabaseKey) {
        return {
            "Content-Type": "application/json",
            "apikey": sSupabaseKey,
            "Authorization": "Bearer " + sSupabaseKey,
            "Prefer": "return=representation"
        };
    }

    async function _postJson(sPath, oBody, sSupabaseKey) {
        const sUrl = SUPABASE_URL + sPath;
        const oHeaders = _buildHeaders(sSupabaseKey);

        try {
            const oResponse = await fetch(sUrl, {
                method: "POST",
                headers: oHeaders,
                body: JSON.stringify(oBody)
            });

            if (!oResponse.ok) {
                const sText = await oResponse.text();
                throw new Error("Supabase-Fehler: " + oResponse.status + " " + sText);
            }

            return oResponse.json();
        } catch (error) {
            if (!navigator.onLine || error instanceof TypeError) {
                OfflineSyncHelper.enqueueRequest(sUrl, "POST", oHeaders, JSON.stringify(oBody));
                return [{ queued: true }];
            }
            throw error;
        }
    }

    async function _getJson(sPath, sSupabaseKey) {
        const sUrl = SUPABASE_URL + sPath;

        try {
            const oResponse = await fetch(sUrl, {
                method: "GET",
                headers: _buildHeaders(sSupabaseKey)
            });

            if (!oResponse.ok) {
                const sText = await oResponse.text();
                throw new Error("Supabase-Fehler: " + oResponse.status + " " + sText);
            }

            return oResponse.json();
        } catch (error) {
            if (!navigator.onLine || error instanceof TypeError) {
                // Can't queue a GET for background execution meaningfully in this context,
                // but we return an empty array to avoid crashing the app offline.
                return []; 
            }
            throw error;
        }
    }

    async function _getCurrentStatusLevel(sUsername, iQuestionId, sSupabaseKey) {
        const sQuery =
            "/rest/v1/" + TABLE_NAME +
            "?user_name=eq." + encodeURIComponent(sUsername) +
            "&question_id=eq." + encodeURIComponent(iQuestionId) +
            "&select=status_level";

        const aRows = await _getJson(sQuery, sSupabaseKey);

        if (!aRows || aRows.length === 0) {
            return null;
        }

        return aRows[0].status_level;
    }

    async function _updateStatusLevelRow(sUsername, iQuestionId, iStatusLevel, sSupabaseKey) {
        const sPath =
            "/rest/v1/" + TABLE_NAME +
            "?user_name=eq." + encodeURIComponent(sUsername) +
            "&question_id=eq." + encodeURIComponent(iQuestionId);
        const sUrl = SUPABASE_URL + sPath;
        const oHeaders = _buildHeaders(sSupabaseKey);
        const sBody = JSON.stringify({ status_level: iStatusLevel });

        try {
            const oResponse = await fetch(sUrl, {
                method: "PATCH",
                headers: oHeaders,
                body: sBody
            });

            if (!oResponse.ok) {
                const sText = await oResponse.text();
                throw new Error("Supabase-Fehler: " + oResponse.status + " " + sText);
            }

            return oResponse.json();
        } catch (error) {
            if (!navigator.onLine || error instanceof TypeError) {
                OfflineSyncHelper.enqueueRequest(sUrl, "PATCH", oHeaders, sBody);
                return [{ queued: true }];
            }
            throw error;
        }
    }

    // async function _upsertStatusLevel(sUsername, iQuestionId, iStatusLevel, sSupabaseKey) {
    //     const oPayload = {
    //         user_name: sUsername,
    //         question_id: iQuestionId,
    //         status_level: iStatusLevel
    //     };

    //     // Upsert nach user_name + question_id
    //     const sPath =
    //         "/rest/v1/" + TABLE_NAME +
    //         "?on_conflict=user_name,question_id";

    //     const aRows = await _postJson(sPath, [oPayload], sSupabaseKey);
    //     return aRows[0];
    // }

    async function _upsertStatusLevel(sUsername, iQuestionId, iStatusLevel, sSupabaseKey) {
        // Gibt es schon einen Eintrag?
        const iCurrent = await _getCurrentStatusLevel(sUsername, iQuestionId, sSupabaseKey);

        if (iCurrent === null || iCurrent === undefined) {
            // Kein Eintrag -> INSERT
            const oPayload = {
                user_name: sUsername,
                question_id: iQuestionId,
                status_level: iStatusLevel
            };

            const sPath = "/rest/v1/" + TABLE_NAME;
            const aRows = await _postJson(sPath, [oPayload], sSupabaseKey);
            return aRows[0];
        } else {
            // Eintrag existiert -> UPDATE (PATCH)
            const aRows = await _updateStatusLevelRow(sUsername, iQuestionId, iStatusLevel, sSupabaseKey);
            return aRows[0];
        }
    }

    return {
        /**
         * Sorgt dafür, dass ein Statuslevel angepasst wird.
         * Wenn kein Eintrag existiert, wird von 3 gestartet.
         * Bei richtiger Antwort +1, bei falscher -1, Grenzen 0–4.
         */
        updateStatusLevelForQuestion: async function (sUsername, sQuestionIdRaw, bIsCorrect, sSupabaseKey) {
            const iQuestionId = Number(sQuestionIdRaw);
            const iMin = 0;
            const iMax = 4;
            const iDefault = 3;

            const iCurrent = await _getCurrentStatusLevel(sUsername, iQuestionId, sSupabaseKey);
            const iBase = (iCurrent === null || iCurrent === undefined) ? iDefault : iCurrent;

            let iNew = iBase;
            if (bIsCorrect) {
                iNew = Math.min(iBase + 1, iMax);
            } else {
                iNew = Math.max(iBase - 1, iMin);
            }

            const oRow = await _upsertStatusLevel(sUsername, iQuestionId, iNew, sSupabaseKey);
            return oRow;
        },

        getQuestionsForUserByMaxLevel: async function (sUsername, iMaxLevel, sSupabaseKey) {
            const iMin = 0;

            const sQuery =
                "/rest/v1/" + TABLE_NAME +
                "?user_name=eq." + encodeURIComponent(sUsername) +
                "&status_level=gte." + iMin +
                "&status_level=lte." + iMaxLevel +
                "&select=question_id,status_level";

            const aRows = await _getJson(sQuery, sSupabaseKey);
            return aRows || [];
        }
    };
});