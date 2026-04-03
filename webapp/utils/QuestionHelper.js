sap.ui.define([
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/CheckBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Panel",
    "sap/m/Image",
    "learninggame/utils/HintHelper"
], function (VBox, HBox, CheckBox, Text, Button, Panel, Image, HintHelper) {
    "use strict";

    // Konstanten
    const bWrapping = true;
    const c_sHINT_ICON = "sap-icon://hint";
    const c_sHINT_TEXT = "Tipp";

    return {

        // ========== Question-Helper ==========
        sanitizeText: function (text) {
            if (!text) return "";
            return text
                // .replace(/\$/g, "S|")           // $ → S
                .replace(/\$/g, "\$")           // $ → S, better
                .replace(/@/g, "(at)")          // @ → at
                .replace(/#/g, "(HASHTAG)")     // # → -
                .replace(/\{/g, "((")           // { → (
                .replace(/\}/g, "))")           // } → )
                .replace(/\*/g, "•");           // * → •
        },

        filterQuestionsByTopics: function (aAllQuestions, selectedTopics) {
            if (selectedTopics.length > 0) {
                aAllQuestions = aAllQuestions.filter(q => selectedTopics.includes(q.QuestionTopicArea));
                console.log(`${aAllQuestions.length} Fragen nach Filter`);
            }
            return aAllQuestions;
        },

        shuffleQuestions: function (aAllQuestions) {
            for (let i = aAllQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [aAllQuestions[i], aAllQuestions[j]] = [aAllQuestions[j], aAllQuestions[i]];
            }
            return aAllQuestions;
        },

        transformQuestionsToModel: function (aQuestions) {
            return aQuestions.map(q => ({
                QuestionID: q.QuestionID,
                QuestionText: this.sanitizeText(q.QuestionText),
                Picture: q.Picture, // wenn vorhanden
                AmountOfTrueAnswers: q.AmountOfTrueAnswers,
                QuestionTopicArea: q.QuestionTopicArea,
                Answers: ["A", "B", "C", "D", "E", "F"]
                    .map(key => ({
                        key,
                        text: this.sanitizeText(q["Answer" + key]),
                        description: this.sanitizeText(q["Answer" + key + "_description"] || ""),
                        correct: q["Answer" + key + "_boolean"],
                        selected: false
                    }))
                    .filter(a => a.text)
                    .sort(() => 0.5 - Math.random())
            }));
        },

        // ========== Panel-Helper ==========
        createQuestionPanel: function (oQuestion, index, bHintEnabled) {
            // Zusatz---
            // Info-Button Box (ID + TopicArea)
            const oInfoBox = new HBox({
                alignItems: "Center",
                justifyContent: "End",
                width: "100%",
            });

            const oBtnID = new Button({
                text: `ID: ${oQuestion.QuestionID}`,
                enabled: false,
                type: "Default"
            });
            oBtnID.addStyleClass("sapUiTinyMarginEnd");

            const oBtnTopic = new Button({
                text: `${oQuestion.QuestionTopicArea}`,
                enabled: false,
                type: "Default"
            });

            oInfoBox.addItem(oBtnID);
            oInfoBox.addItem(oBtnTopic);
            // Zusatz Ende---

            // Fragetext
            const oQuestionText = new Text({ text: oQuestion.QuestionText, wrapping: bWrapping });
            oQuestionText.addStyleClass("sapUiMediumMarginBottom");

            // VBox für Fragetext + Anzahl korrekter Antworten
            const oVBoxQuestionInfo = new VBox({ width: "100%" });
            oVBoxQuestionInfo.addItem(oQuestionText);

            // Wenn Picture vorhanden, hinzufügen
            if (oQuestion.Picture && oQuestion.Picture.trim()) {
                // console.log("Bild gefunden:", oQuestion.Picture);
                const oQuestionImage = new Image({
                    src: "/" + oQuestion.Picture,
                    // src: sap.ui.require.toUrl("learninggame") + "/" + oQuestion.Picture,
                    height: "auto",
                    decorative: false
                });
                // console.log("🖼️ Image Control erstellt:", oQuestionImage);
                oQuestionImage.addStyleClass("sapUiMediumMarginBottom questionImage");
                oVBoxQuestionInfo.addItem(oQuestionImage);
                // console.log("✅ Bild zu VBox hinzugefügt");
            } else {
                // console.log("❌ KEIN BILD:", { 
                //     hasPicture: !!oQuestion.Picture,
                //     pictureValue: oQuestion.Picture,
                //     trimmed: oQuestion.Picture?.trim()
                // });

            }


            const oTextAnswers = new Text({
                text: `Anzahl korrekter Antworten: ${oQuestion.AmountOfTrueAnswers}`,
                wrapping: bWrapping
            });
            oTextAnswers.addStyleClass("sapUiSmallMarginTop sapUiEmphasizedText");
            oVBoxQuestionInfo.addItem(oTextAnswers);

            // VBox für Nutzerantworten (Checkboxen)
            const oVBoxUser = new VBox({ width: "100%" }); // PanelScollBreite
            oVBoxUser.addStyleClass("sapUiMediumMarginBottom sapUiTinyMarginBeginEnd");

            const aAnswerControls = oQuestion.Answers.map(ans => {
                const cb = new CheckBox({ text: ans.text, selected: ans.selected, enabled: true, wrapping: bWrapping });
                cb.addStyleClass("sapUiTinyMarginBottom");
                return cb;
            });
            aAnswerControls.forEach(cb => oVBoxUser.addItem(cb));

            // Bestätigen Button
            const oBtnConfirm = new Button({
                text: "Bestätigen",
                type: "Emphasized"
            });
            oBtnConfirm.addStyleClass("sapUiSmallMarginBottom sapUiTinyMarginBegin");

            const oHBoxMainButtons = new HBox({ items: [oBtnConfirm] });
            let oBtnHint = null;

            if (bHintEnabled && HintHelper.bIsHintApplicable(oQuestion)) {
                oBtnHint = new Button({
                    text: c_sHINT_TEXT,
                    icon: c_sHINT_ICON,
                    type: "Default",
                    press: function () {
                        HintHelper.fApplyHint(oQuestion, aAnswerControls, oBtnHint);
                    }
                });
                oBtnHint.addStyleClass("sapUiSmallMarginBottom sapUiTinyMarginBegin sapUiTinyMarginEnd");
                // oHBoxMainButtons.insertItem(oBtnHint, 0); // Hint Button an erster Stelle
                oHBoxMainButtons.addItem(oBtnHint); // Hint Button an letzter Stelle
            }

            const oBtnAskGPT = new Button({
                text: "Bei Perplexity nachfragen",
                icon: "sap-icon://message-information"
            });
            oBtnAskGPT.addStyleClass("sapUiSmallMarginBottom sapUiTinyMarginBegin");

            // VBox für Lösungsvorschau
            const oVBoxSolution = new VBox({ width: "100%" });
            oVBoxSolution.setVisible(false);
            oVBoxSolution.addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBeginEnd");

            // Neue Panel
            const oPanel = new Panel({
                headerText: `Frage ${index + 1}`,
                expandable: false,
                width: "100%",
                content: [
                    oVBoxQuestionInfo,
                    oVBoxUser,
                    oHBoxMainButtons,
                    oInfoBox,
                    oVBoxSolution
                ],
                visible: index === 0
            });

            oPanel.addStyleClass("sapUiLargeMarginBottom customCardPanel");
            oPanel._oVBoxSolutionBelow = oVBoxSolution;
            oPanel._aAnswerControls = aAnswerControls;
            oPanel._oBtnConfirm = oBtnConfirm;
            oPanel._oBtnHint = oBtnHint;
            oPanel._oBtnAskGPT = oBtnAskGPT;

            return oPanel;
        },

        // ========== CheckAnswer ==========
        evaluateAnswer: function (oQuestion, aAnswerControls) {
            // let nCorrectThisQuestion = 0;
            let nCorrectSelected = 0;
            let nTotalSelected = 0;

            // Nutzer-Antworten auswerten und einfärben
            oQuestion.Answers.forEach((ans, i) => {
                const oCheckBox = aAnswerControls[i];
                ans.selected = oCheckBox.getSelected();
                oCheckBox.setEnabled(false);

                // Farbliche Markierung
                if ((ans.selected && ans.correct) || (!ans.selected && !ans.correct)) {
                    oCheckBox.addStyleClass("sapUiTextSuccess"); // grün
                } else {
                    oCheckBox.addStyleClass("sapUiTextError");   // rot
                }

                // Zähler für komplett richtige Antworten
                // alt
                // if (ans.selected === ans.correct && ans.correct) {
                // if (ans.selected === ans.correct) {
                // if (ans.selected && ans.correct) {
                //     nCorrectThisQuestion++;
                // }
                if (ans.selected && ans.correct) {
                    nCorrectSelected++;
                }
                if (ans.selected) {
                    nTotalSelected++;
                }
            });

            // return nCorrectThisQuestion;
            return {
                nCorrectSelected: nCorrectSelected,
                nTotalSelected: nTotalSelected,
                nCorrectExpected: oQuestion.AmountOfTrueAnswers,
                isFullyCorrect: nCorrectSelected === oQuestion.AmountOfTrueAnswers && nTotalSelected === oQuestion.AmountOfTrueAnswers
            };
        },

        createSolutionDisplay: function (oQuestion, oVBoxSolution) {
            oVBoxSolution.removeAllItems();
            oVBoxSolution.addItem(new Text({ text: "Richtige Antworten:" }));

            oQuestion.Answers.forEach(ans => {
                const oSolutionCheckBox = new CheckBox({
                    text: ans.text,
                    selected: ans.correct,
                    enabled: false,
                    wrapping: bWrapping
                });

                // Gleiche Logik für die Lösungsvorschau
                if ((ans.selected && ans.correct) || (!ans.selected && !ans.correct)) {
                    oSolutionCheckBox.addStyleClass("solutionCorrect");
                } else {
                    oSolutionCheckBox.addStyleClass("solutionWrong");
                }


                oVBoxSolution.addItem(oSolutionCheckBox);

                // Neu
                if (ans.description) {
                    const oDescText = new Text({
                        text: ans.description,
                        wrapping: bWrapping
                    });
                    oDescText.addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginBottom answerDescription");
                    oVBoxSolution.addItem(oDescText);
                }

                oSolutionCheckBox.addStyleClass("sapUiTinyMarginBottom");

            });
            oVBoxSolution.setVisible(true);
        },




        // ========== AI-Integration ==========
        generatePrompt: function (oQuestion, bTCA) {
            // Prompt generieren
            let prompt = "Bitte erkläre mir folgende Prüfungsfrage:\n\n";
            prompt += "Frage:\n" + oQuestion.QuestionText + "\n\n";
            prompt += "Es gibt anscheinend " + oQuestion.AmountOfTrueAnswers + " richtige Antwort(en).\n\n";

            prompt += "Antwortmöglichkeiten:\n";

            if (bTCA) {
                oQuestion.Answers.forEach(a => {
                    prompt += `- ${a.text} (${a.correct ? "RICHTIG" : "FALSCH"})`;

                    if (a.description) {
                        prompt += `\n  Erklärung: ${a.description}`;
                    }

                    prompt += `\n`;
                });
            } else {
                oQuestion.Answers.forEach(a => {
                    prompt += `- ${a.text} \n`;
                });
            }

            prompt += "\nBitte erkläre mir ausführlich, warum die Antworten so sind. Also warum sie richtig oder falsch sind. Versuche ggf. am Ende ein Anwendungsbeispiel anzuhängen. Antworte unvoreingenommen.";

            return prompt;
        },

        getAIUrl: function (aiKey) {
            const URLCollection = {
                "AI01": "https://chat.openai.com",  // ChatGPT
                "AI02": "https://gemini.google.com", // Gemini  
                "AI03": "https://www.perplexity.ai", // Perplexity
                "AI04": "https://chat.mistral.ai"    // Mistral
            };
            return URLCollection[aiKey];
        },

        // ========== FooterProgress ==========
        updateFooterProgress: function (oFooter, aQuestionControls, oGameSettings) {
            oFooter.removeAllItems();

            const maxDots = sap.ui.Device.system.phone ? 0 : 40;
            aQuestionControls.slice(0, maxDots).forEach(panel => {
                let dotClass = "footerProgressDot";

                const solutionVisible = panel._oVBoxSolutionBelow.getVisible();
                if (solutionVisible) {
                    // Prüfen ob die Frage richtig war
                    // let nCorrect = 0;
                    // const oQuestion = panel.data("question");
                    // oQuestion.Answers.forEach(a => { if (a.selected === a.correct && a.correct) nCorrect++; });

                    // if (nCorrect === oQuestion.AmountOfTrueAnswers) dotClass += " correct";
                    // else dotClass += " wrong";

                    const oQuestion = panel.data("question");
                    let nCorrectSelected = 0;
                    let nTotalSelected = 0;
                    oQuestion.Answers.forEach(a => {
                        if (a.selected && a.correct) nCorrectSelected++;
                        if (a.selected) nTotalSelected++;
                    });

                    if (nCorrectSelected === oQuestion.AmountOfTrueAnswers &&
                        nTotalSelected === oQuestion.AmountOfTrueAnswers) {
                        dotClass += " correct";
                    } else {
                        dotClass += " wrong";
                    }
                }

                const dot = new Text({ text: "●" });
                dot.addStyleClass(dotClass);
                oFooter.addItem(dot);
            });

            // --- Prozentanzeige rechts im Footer ergänzen ---
            const nTotal = aQuestionControls ? aQuestionControls.length : 0;
            const nCorrectTotal = oGameSettings.getProperty("/correctAnswersCount") || 0;

            let sText = "";
            if (nTotal > 0) {
                const percent = Math.round((nCorrectTotal / nTotal) * 100);
                // sText = nCorrectTotal + " / " + nTotal + " (" + percent + "%)";
                sText = nCorrectTotal + " von " + nTotal + " richtig" + " (" + percent + "%)";
            } else {
                sText = "0 / 0 (0%)";
            }

            // Spacer + Text ans Toolbar-Ende setzen
            const oSpacer = new sap.m.ToolbarSpacer();
            const oPercentText = new Text({ text: sText });
            oPercentText.addStyleClass("footerProgressPercent");

            oFooter.addItem(oSpacer);
            oFooter.addItem(oPercentText);
        }

    };
});
