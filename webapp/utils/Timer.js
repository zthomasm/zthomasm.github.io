sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function(JSONModel, MessageBox) {
    "use strict";

    return {
        doSomething: function(oController) {
            
        },

        calculateTimePerQuestion: function(iNumberOfQuestions, sTimeString) {
            // String "HH:mm:ss" → Sekunden
            var aParts = sTimeString.split(":");
            var iTotalSeconds = parseInt(aParts[0], 10) * 3600 + 
                               parseInt(aParts[1], 10) * 60 + 
                               parseInt(aParts[2], 10);

            // Sekunden pro Frage berechnen
            var iSecondsPerQuestion = Math.floor(iTotalSeconds / iNumberOfQuestions);

            return iSecondsPerQuestion;  // ← Einfach zurückgeben!
        },

        startTimer: function(oTimerModel, iTotalSeconds) {
            if (!oTimerModel) return;

            oTimerModel.setProperty("/iRemainingSeconds", iTotalSeconds);
            oTimerModel.setProperty("/bTimerRunning", true);
            this.formatAndUpdateTime(oTimerModel, iTotalSeconds);

            var iRemaining = iTotalSeconds;
            var that = this;

            if (oTimerModel._timerInterval) {
                clearInterval(oTimerModel._timerInterval);
            }

            oTimerModel._timerInterval = setInterval(function() {
                iRemaining--;
                oTimerModel.setProperty("/iRemainingSeconds", iRemaining);
                that.formatAndUpdateTime(oTimerModel, iRemaining);

                if (iRemaining <= 0) {
                    that.stopTimer(oTimerModel);
                }
            }, 1000);
        },

        /**
         * Pausiert den Timer
         */
        pauseTimer: function(oTimerModel) {
            if (!oTimerModel || !oTimerModel._timerInterval) return;
            
            clearInterval(oTimerModel._timerInterval);
            oTimerModel.setProperty("/bTimerRunning", false);
        },

        /**
         * Setzt den Timer fort
         */
        resumeTimer: function(oTimerModel) {
            if (!oTimerModel) return;

            var iRemaining = oTimerModel.getProperty("/iRemainingSeconds");
            var that = this;

            oTimerModel.setProperty("/bTimerRunning", true);

            oTimerModel._timerInterval = setInterval(function() {
                iRemaining--;
                oTimerModel.setProperty("/iRemainingSeconds", iRemaining);
                that.formatAndUpdateTime(oTimerModel, iRemaining);

                if (iRemaining <= 0) {
                    that.stopTimer(oTimerModel);
                }
            }, 1000);
        },

        /**
         * Stoppt den Timer
         */
        stopTimer: function(oTimerModel) {
            if (!oTimerModel) return;

            if (oTimerModel._timerInterval) {
                clearInterval(oTimerModel._timerInterval);
            }
            oTimerModel.setProperty("/bTimerRunning", false);
            oTimerModel.setProperty("/iRemainingSeconds", 0);

            sap.m.MessageBox.information("Timer: Zeit ist vorbei!");
        },

        /**
         * Formatiert Sekunden zu "HH:mm:ss" und speichert im Model
         */
        formatAndUpdateTime: function(oTimerModel, iSeconds) {
            var sFormatted = this.formatSecondsToTime(iSeconds);
            oTimerModel.setProperty("/sRemainingTimeFormatted", sFormatted);
        },

        /**
         * Formatiert Sekunden zu "HH:mm:ss"
         */
        formatSecondsToTime: function(iSeconds) {
            var h = Math.floor(iSeconds / 3600);
            var m = Math.floor((iSeconds % 3600) / 60);
            var s = iSeconds % 60;
            return this._padZero(h) + ":" + this._padZero(m) + ":" + this._padZero(s);
        },

        _padZero: function(iNum) {
            return iNum < 10 ? "0" + iNum : iNum.toString();
        },

        

    };
});
