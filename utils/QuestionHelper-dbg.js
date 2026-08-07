sap.ui.define([
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/CheckBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Panel",
    "sap/m/Image",
    "learninggame/utils/HintHelper",
    "learninggame/utils/SupabaseHelper"
], function (VBox, HBox, CheckBox, Text, Button, Panel, Image, HintHelper, SupabaseHelper) {
    "use strict";

    // Konstanten
    const bWrapping = true;
    const c_sHINT_ICON = "sap-icon://hint";
    const c_sHINT_TEXT = "Tipp";

    return {

        // // ========== UI Helper ==========
        // showPlusOneAnimation: function () {
        //     const bShowAnimation = false; // Toggle für +1 Animation

        //     if (!bShowAnimation) {
        //         return;
        //     }

        //     // Spielerische "+1" Animation
        //     const oOverlay = document.createElement("div");
        //     oOverlay.className = "plusOneOverlay";

        //     const oText = document.createElement("div");
        //     oText.className = "plusOneText";
        //     oText.innerText = "+1";

        //     oOverlay.appendChild(oText);
        //     document.body.appendChild(oOverlay);

        //     // Entfernen nach der Animation (1.2s)
        //     setTimeout(() => {
        //         if (document.body.contains(oOverlay)) {
        //             document.body.removeChild(oOverlay);
        //         }
        //     }, 1200);
        // },

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

        mapSpanishWordsToQuestions: function (aAllSpanishWords) {
            return aAllSpanishWords.map(word => {
                let wrongWords = aAllSpanishWords.filter(w => w.id !== word.id && w.type_of_word === word.type_of_word).sort(() => 0.5 - Math.random()).slice(0, 3);
                // Fallback falls nicht genug Wörter des gleichen Typs vorhanden sind
                if (wrongWords.length < 3) {
                    let additionalWrongWords = aAllSpanishWords.filter(w => w.id !== word.id && !wrongWords.includes(w)).sort(() => 0.5 - Math.random()).slice(0, 3 - wrongWords.length);
                    wrongWords = wrongWords.concat(additionalWrongWords);
                }
                let answers = [
                    { key: "A", text: word.en_word, correct: true, _boolean: true }
                ];
                let keys = ["B", "C", "D"];
                wrongWords.forEach((w, idx) => {
                    answers.push({ key: keys[idx], text: w.en_word, correct: false, _boolean: false });
                });
                
                return {
                    QuestionID: word.id,
                    QuestionText: word.sp_word,
                    Picture: "",
                    AmountOfTrueAnswers: 1,
                    QuestionTopicArea: word.type_of_word,
                    AnswerA: answers[0].text, AnswerA_boolean: answers[0].correct,
                    AnswerB: answers[1] ? answers[1].text : "", AnswerB_boolean: answers[1] ? answers[1].correct : false,
                    AnswerC: answers[2] ? answers[2].text : "", AnswerC_boolean: answers[2] ? answers[2].correct : false,
                    AnswerD: answers[3] ? answers[3].text : "", AnswerD_boolean: answers[3] ? answers[3].correct : false,
                    AnswerE: "", AnswerE_boolean: false,
                    AnswerF: "", AnswerF_boolean: false
                };
            });
        },

        buildQuestionSet: async function (oController, aAllQuestions) {
            const oGameSettings = oController.oGameSettings;
            const sMode = oGameSettings.getProperty("/sMode") || "gameMode";
            const nQuestions = oGameSettings.getProperty("/numberOfQuestions") || 3;
            const selectedTopics = oGameSettings.getProperty("/selectedTopics") || [];

            // 1) Immer zuerst nach Topics filtern (gilt für alle Modi)
            let aPool = this.filterQuestionsByTopics(aAllQuestions, selectedTopics);

            if (sMode === "studyMode") {
                // Übungsmodus: IDs aus Supabase / Level-basiert
                return await this._buildStudySet(oController, aPool, nQuestions);
            }

            if (sMode === "showAllQuestions") {
                // Alle Fragen anzeigen, keine Beschränkung durch nQuestions
                return aPool;
            }

            // Default: gameMode = freies Quiz
            return this._buildGameSet(oController, aPool, nQuestions);
        },

        _buildGameSet: function (oController, aPool, nQuestions) {
            // Falls du im freien Modus gar keinen Level-Filter willst, lass das weg.
            // Wenn du einen weichen Level-Filter willst, kannst du ihn hier reinziehen:
            // aPool = await this.filterQuestionsByLevel(oController, aPool);

            aPool = this.shuffleQuestions(aPool);
            return aPool.slice(0, nQuestions);
        },

        _buildStudySet: async function (oController, aPool, nQuestions) {
            const oComponent = oController.getOwnerComponent();
            const oUserSettings = oComponent.getModel("userSettings");
            const oGameSettings = oController.oGameSettings;

            const bLoggedIn = oUserSettings.getProperty("/bUserIsLoggedIn");
            const sUsername = oUserSettings.getProperty("/sUsername");
            const sSupabaseKey = oUserSettings.getProperty("/sApiKey");
            const iMaxLevel = oGameSettings.getProperty("/iLevelQuestions") || 1;

            if (!bLoggedIn || !sUsername || !sSupabaseKey) {
                console.warn("StudyMode: kein Login vorhanden.");
                return [];
            }

            // Level-IDs aus Supabase holen
            const sActiveTopic = oController.oTopicModel.getProperty("/activeTopic");
            let aLevelRows;

            if (sActiveTopic === "SPANISH") {
                aLevelRows = await SupabaseHelper.getSpanishWordsForUserByMaxLevel(
                    sUsername,
                    iMaxLevel,
                    sSupabaseKey
                );
            } else {
                aLevelRows = await SupabaseHelper.getQuestionsForUserByMaxLevel(
                    sUsername,
                    iMaxLevel,
                    sSupabaseKey
                );
            }

            const aIds = aLevelRows.map(row => row.question_id !== undefined ? row.question_id : row.voca_id);
            console.log("StudyMode-IDs:", aIds);

            if (!aIds.length) {
                console.warn("StudyMode: keine Fragen im gewünschten Level gefunden.");
                return [];
            }

            // Pool auf Fehler-/Level-Fragen einschränken
            let aStudyQuestions = aPool.filter(q => aIds.includes(Number(q.QuestionID)));

            if (aStudyQuestions.length > nQuestions) {
                aStudyQuestions = this.shuffleQuestions(aStudyQuestions).slice(0, nQuestions);
            } else {
                aStudyQuestions = this.shuffleQuestions(aStudyQuestions);
                // keine Auffüllung, wenn du im Study-Mode wirklich NUR Fehler üben willst
            }

            return aStudyQuestions;
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

                // Use toUrl to ensure the path is resolved correctly depending on the deployment environment
                // This prevents 404 errors when running inside a Fiori Launchpad where the root path is different
                const sImagePath = sap.ui.require.toUrl("learninggame") + "/" + oQuestion.Picture.trim();

                const oQuestionImage = new Image({
                    src: sImagePath,
                    height: "auto",
                    width: "100%", // Explicitly give Safari a width hint
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
            const oVBoxUser = new VBox({ width: "auto" }); // PanelScollBreite
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
            const oVBoxSolution = new VBox({ width: "auto" });
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

        updateFooterProgress: function (oFooter, aQuestionControls, oGameSettings, oTextControl) {
            oFooter.removeAllItems();

            aQuestionControls.forEach(panel => {
                let segmentClass = "absoluteProgressSegment";

                const solutionVisible = panel._oVBoxSolutionBelow.getVisible();
                if (solutionVisible) {
                    const oQuestion = panel.data("question");
                    let nCorrectSelected = 0;
                    let nTotalSelected = 0;
                    oQuestion.Answers.forEach(a => {
                        if (a.selected && a.correct) nCorrectSelected++;
                        if (a.selected) nTotalSelected++;
                    });

                    if (nCorrectSelected === oQuestion.AmountOfTrueAnswers &&
                        nTotalSelected === oQuestion.AmountOfTrueAnswers) {
                        segmentClass += " correct";
                    } else {
                        segmentClass += " wrong";
                    }
                }

                // Ein leeres HBox-Element als Segment, da flex: 1 es ausdehnt
                const segment = new sap.m.HBox();
                segment.addStyleClass(segmentClass);
                oFooter.addItem(segment);
            });

            // --- Prozentanzeige setzen ---
            const nTotal = aQuestionControls ? aQuestionControls.length : 0;
            const nCorrectTotal = oGameSettings.getProperty("/correctAnswersCount") || 0;

            let sText = "";
            if (nTotal > 0) {
                const percent = Math.round((nCorrectTotal / nTotal) * 100);
                sText = nCorrectTotal + " von " + nTotal + " richtig (" + percent + "%)";
            } else {
                sText = "0 / 0 (0%)";
            }

            if (oTextControl) {
                oTextControl.setText(sText);
            }
        },

        filterQuestionsByLevel: async function (oController, aAllQuestions) {
            const oComponent = oController.getOwnerComponent();
            const oUserSettings = oComponent.getModel("userSettings");
            const oGameSettings = oController.oGameSettings; // im Controller gesetzt

            const bLoggedIn = oUserSettings.getProperty("/bUserIsLoggedIn");
            const sUsername = oUserSettings.getProperty("/sUsername");
            const sSupabaseKey = oUserSettings.getProperty("/sApiKey");
            const iMaxLevel = oGameSettings.getProperty("/iLevelQuestions");
            const nQuestions = oGameSettings.getProperty("/numberOfQuestions") || 3;

            // Kein Login oder Slider = 5 → nichts filtern
            if (!bLoggedIn || !sUsername || !sSupabaseKey || iMaxLevel === null || iMaxLevel === 5) {
                console.log("Level-Filter übersprungen (kein Login oder MaxLevel=5).");
                return aAllQuestions;
            }

            try {
                const aLevelRows = await SupabaseHelper.getQuestionsForUserByMaxLevel(
                    sUsername,
                    iMaxLevel,
                    sSupabaseKey
                );

                const aAllowedIds = aLevelRows.map(row => row.question_id);
                console.log("Level-Filter IDs:", aAllowedIds, "maxLevel:", iMaxLevel);

                if (!aAllowedIds.length) {
                    console.warn("Keine Level-Fragen in DB. Fallback: alle Fragen.");
                    return aAllQuestions;
                }

                // 1) Alle Fragen, die im Level-Bereich sind
                const aLevelQuestions = aAllQuestions.filter(function (q) {
                    const iId = Number(q.QuestionID);
                    const bMatch = aAllowedIds.includes(iId);
                    if (bMatch) {
                        console.log("MATCH in Level-Filter:", q.QuestionID);
                    }
                    return bMatch;
                });

                // 2) Restfragen (nicht im Level-Bereich)
                const aRemainingQuestions = aAllQuestions.filter(function (q) {
                    const iId = Number(q.QuestionID);
                    return !aAllowedIds.includes(iId);
                });

                // 3) Level-Fragen + Restfragen zusammen
                const aCombined = aLevelQuestions.concat(aRemainingQuestions);

                // Wichtig: Hier NICHT slicen – das macht dein Controller wie bisher
                // Dadurch sind Level-Fragen garantiert Teil der Liste, bevor gemischt wird.

                return aCombined;
            } catch (e) {
                console.error("Fehler beim Laden der Levels aus Supabase:", e);
                return aAllQuestions;
            }
        }

    };
});
