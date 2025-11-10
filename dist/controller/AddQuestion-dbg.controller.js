sap.ui.define([
    "learninggame/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function(BaseController, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("learninggame.controller.AddQuestion", {

        onInit: function() {
            // GameSettings (global) verfügbar
            this._oGameSettings = this.getOwnerComponent().getModel("GameSettings");

            // Default nextID — wird nach Laden der JSON überschrieben
            this._nextID = 1;

            // Lade die vorhandenen Fragen um die höchste QuestionID zu bestimmen
            const oQuizModel = new JSONModel();
            oQuizModel.loadData("/model/FioriQuestions.json");

            oQuizModel.attachRequestCompleted(() => {
                const oData = oQuizModel.getData();
                if (oData && Array.isArray(oData.results) && oData.results.length > 0) {
                    const maxId = oData.results.reduce((max, q) => {
                        const id = Number(q.QuestionID) || 0;
                        return id > max ? id : max;
                    }, 0);
                    this._nextID = maxId + 1;
                } else {
                    this._nextID = 1;
                }
                MessageToast.show(`Nächste QuestionID: ${this._nextID}`);
            });

            oQuizModel.attachRequestFailed(() => {
                // Falls Laden fehlschlägt, bleibt nextID = 1
                this._nextID = 1;
            });
        },

        _getInputValue: function(sId) {
            const o = this.byId(sId);
            return o ? (o.getValue ? o.getValue().trim() : "") : "";
        },

        _getChecked: function(sId) {
            const o = this.byId(sId);
            return o ? (!!o.getSelected && o.getSelected()) : false;
        },

        onGenerateJSON: function() {
            const sQuestionText = this._getInputValue("inpQuestionText");
            if (!sQuestionText) {
                MessageToast.show("Bitte erst den Fragetext eingeben.");
                return;
            }

            // Sammle Antworten dynamisch A..F
            const aLetters = ["A","B","C","D","E","F"];
            const aAnswers = aLetters.map(letter => {
                return {
                    key: letter,
                    text: this._getInputValue("inp" + letter),
                    correct: this._getChecked("chk" + letter)
                };
            });

            // Filtere nur echte Antworten (mit Text)
            const aValidAnswers = aAnswers.filter(a => a.text && a.text.length > 0);

            // Topic: aus Select (falls nichts gewählt, leer string)
            const oSel = this.byId("selTopic");
            const sTopic = oSel ? (oSel.getSelectedKey() || oSel.getSelectedItem && oSel.getSelectedItem().getText() || "") : "";

            // Erstelle Frage-Objekt mit vollständigen Feldern A..F + boolean flags
            const oQuestion = {
                QuestionID: this._nextID,
                QuestionText: sQuestionText,
                AmountOfTrueAnswers: aValidAnswers.filter(a => a.correct).length,
                QuestionTopicArea: sTopic || ""
            };

            // Fülle dynamisch AnswerA..F + AnswerX_boolean
            aLetters.forEach(letter => {
                const oAns = aAnswers.find(a => a.key === letter);
                oQuestion["Answer" + letter] = oAns && oAns.text ? oAns.text : "";
                oQuestion["Answer" + letter + "_boolean"] = !!(oAns && oAns.correct);
            });

            const sJson = JSON.stringify(oQuestion, null, 4);
            this.byId("txtResult").setValue(sJson);

            MessageToast.show(`JSON für QuestionID ${this._nextID} erstellt.`);
            // Next ID hochzählen — nützlich bei mehreren Einträgen hintereinander
            this._nextID++;
        },

        onDownloadJSON: function() {
            const sContent = this.byId("txtResult").getValue();
            if (!sContent) {
                MessageToast.show("Keine JSON-Daten zum Herunterladen. Bitte zuerst generieren.");
                return;
            }
            const blob = new Blob([sContent], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Question-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

    });
});
