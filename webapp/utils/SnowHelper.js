/**
 * SnowHelper
 * 
 * Verwaltet den Weihnachts-Schnee-Effekt für die Startseite.
 * - Flocken spawnen graduell (nicht alle auf einmal)
 * - Realistische Physik mit Wind-Sway
 * - Lifecycle-Management (Start/Stop)
 * - Speichereffizient (Flocken recyclen)
 * 
 * Verwendung im Controller:
 *   onInit() {
 *       SnowHelper.startSnow(this);
 *   }
 *   onBeforeHide() {
 *       SnowHelper.stopSnow(this);
 *   }
 */

sap.ui.define([], function() {
    "use strict";

    return {
        // ==================== PUBLIC API ====================

        /**
         * Schnee-Effekt STARTEN
         * 
         * @param {sap.ui.core.mvc.Controller} oController - Der aufrufende Controller
         * @public
         */
        startSnow: function(oController) {
            console.log("🎄 SnowHelper: Schnee GESTARTET");

            // === State initialisieren ===
            oController._snowflakes = [];
            oController._isSnowActive = true;
            oController._animationId = null;
            oController._spawnInterval = null;

            // === Alten Schnee aufräumen ===
            this._cleanupExistingSnow();

            // === Neuen Container erstellen ===
            const oSnowContainer = this._createSnowContainer();
            oController._snowDiv = oSnowContainer;

            // === Flocken graduell spawnen ===
            this._startSpawning(oController, oSnowContainer);

            // === Animation Loop starten ===
            this._startAnimation(oController);
        },

        /**
         * Schnee-Effekt STOPPEN
         * 
         * @param {sap.ui.core.mvc.Controller} oController - Der aufrufende Controller
         * @public
         */
        stopSnow: function(oController) {
            console.log("❌ SnowHelper: Schnee GESTOPPT");

            // === State deaktivieren ===
            oController._isSnowActive = false;

            // === Spawn-Interval abbrechen ===
            if (oController._spawnInterval) {
                clearInterval(oController._spawnInterval);
                oController._spawnInterval = null;
            }

            // === Animation-Frame abbrechen ===
            if (oController._animationId) {
                cancelAnimationFrame(oController._animationId);
                oController._animationId = null;
            }

            // === DOM aufräumen ===
            if (oController._snowDiv) {
                oController._snowDiv.remove();
                oController._snowDiv = null;
            }

            // === Arrays leeren ===
            oController._snowflakes = [];
        },

        // ==================== PRIVATE METHODS ====================

        /**
         * Existierenden Schnee-Container entfernen (falls vorhanden)
         * @private
         */
        _cleanupExistingSnow: function() {
            const oExistingContainer = document.getElementById("snowContainer");
            if (oExistingContainer) {
                oExistingContainer.remove();
            }
        },

        /**
         * Schnee-Container DOM-Element erstellen
         * 
         * @returns {HTMLElement} Der neu erstellte Container
         * @private
         */
        _createSnowContainer: function() {
            const oContainer = document.createElement('div');
            oContainer.id = "snowContainer";
            oContainer.style.cssText = 
                'position:fixed;' +
                'top:0;' +
                'left:0;' +
                'width:100%;' +
                'height:100%;' +
                'z-index:9999;' +
                'pointer-events:none;' +
                'overflow:hidden;';
            document.body.appendChild(oContainer);
            return oContainer;
        },

        /**
         * Starte graduelles Spawnen von Schneeflocken
         * Alle 100ms spawnt eine neue Flocke (statt alle auf einmal)
         * 
         * @param {sap.ui.core.mvc.Controller} oController - Der Controller
         * @param {HTMLElement} oContainer - Der Snow-Container
         * @private
         */
        _startSpawning: function(oController, oContainer) {
            const CONFIG = {
                MAX_FLAKES: 30,
                SPAWN_INTERVAL_MS: 250  // Neue Flocke alle 100ms
            };

            let iFlakeCount = 0;

            oController._spawnInterval = setInterval(() => {
                // === Stop-Bedingungen ===
                if (!oController._isSnowActive) {
                    clearInterval(oController._spawnInterval);
                    oController._spawnInterval = null;
                    return;
                }

                if (iFlakeCount >= CONFIG.MAX_FLAKES) {
                    clearInterval(oController._spawnInterval);
                    oController._spawnInterval = null;
                    return;
                }

                // === Neue Flocke erstellen ===
                this._createSnowflake(oController, oContainer);
                iFlakeCount++;

            }, CONFIG.SPAWN_INTERVAL_MS);
        },

        /**
         * Erstelle eine einzelne Schneeflocke mit realistischen Eigenschaften
         * 
         * @param {sap.ui.core.mvc.Controller} oController - Der Controller
         * @param {HTMLElement} oContainer - Der Snow-Container
         * @private
         */
        _createSnowflake: function(oController, oContainer) {
            // === Flockeneigenschaften generieren ===
            const iSize = Math.random() * 12 + 6;              // 6-18px
            const iOpacity = Math.random() * 0.4 + 0.3;        // 0.3-0.7
            const iInitialX = Math.random() * window.innerWidth;
            const iSpeed = Math.random() * 1.5 + 0.8;          // 0.8-2.3 px/frame
            const iSway = (Math.random() - 0.5) * 2;           // -1 bis +1 (Wind-Effekt)

            // === DOM-Element erstellen ===
            const oFlakeElem = document.createElement('div');
            oFlakeElem.innerHTML = '❄';
            oFlakeElem.style.cssText = 
                'position:absolute;' +
                'color:#4a90e2;' +
                `font-size:${iSize}px;` +
                `left:${iInitialX}px;` +
                'top:-10px;' +
                `opacity:${iOpacity};` +
                'pointer-events:none;' +
                'text-shadow:0 1px 2px rgba(0,0,0,0.3);' +
                'user-select:none;';
            oContainer.appendChild(oFlakeElem);

            // === Flockendaten speichern ===
            oController._snowflakes.push({
                elem: oFlakeElem,
                x: iInitialX,
                y: -10,
                size: iSize,
                speed: iSpeed,
                sway: iSway
            });
        },

        /**
         * Starte die Animation-Loop mit requestAnimationFrame
         * Aktualisiert Position jeder Flocke kontinuierlich
         * 
         * @param {sap.ui.core.mvc.Controller} oController - Der Controller
         * @private
         */
        _startAnimation: function(oController) {
            const fnAnimate = () => {
                // === Stop-Bedingung ===
                if (!oController._isSnowActive) {
                    return;
                }

                // === Jede Flocke aktualisieren ===
                oController._snowflakes.forEach(oFlake => {
                    // Vertikal fallen
                    oFlake.y += oFlake.speed;

                    // Horizontale Drift mit Sinus-Wave (realistischer Wind)
                    oFlake.x += Math.sin(oFlake.y * 0.005) * oFlake.sway;

                    // === Flocke recyclen wenn unten angekommen ===
                    if (oFlake.y > window.innerHeight) {
                        oFlake.y = -20;                              // Oben starten
                        oFlake.x = Math.random() * window.innerWidth; // Zufällige X-Position
                    }

                    // === DOM-Position aktualisieren ===
                    oFlake.elem.style.left = oFlake.x + 'px';
                    oFlake.elem.style.top = oFlake.y + 'px';
                });

                // === Nächsten Frame planen ===
                oController._animationId = requestAnimationFrame(fnAnimate);
            };

            fnAnimate();
        }
    };
});
