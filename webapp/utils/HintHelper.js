sap.ui.define([], function() {
    "use strict";

    // Configuration / Constants
    const c_sCSS_CLASS_CROSSED_OUT = "hintCrossedOut";
    const c_nMIN_WRONG_ANSWERS_FOR_HINT = 1;

    return {
        /**
         * Checks if the hint feature is applicable for the current question.
         * It is applicable only if there are MORE than c_nMIN_WRONG_ANSWERS_FOR_HINT wrong answers available.
         */
        bIsHintApplicable: function(oQuestion) {
            const aAnswers = oQuestion.Answers;
            let nWrongCount = 0;
            
            for (let iIndex = 0; iIndex < aAnswers.length; iIndex++) {
                if (!aAnswers[iIndex].correct) {
                    nWrongCount++;
                }
            }
            
            return nWrongCount > c_nMIN_WRONG_ANSWERS_FOR_HINT;
        },

        /**
         * Applies the hint logic to cross out one wrong answer.
         */
        fApplyHint: function(oQuestion, aAnswerControls, oBtnHint) {
            const aAnswers = oQuestion.Answers;
            const aWrongIndices = [];

            for (let iIndex = 0; iIndex < aAnswers.length; iIndex++) {
                const oAnswer = aAnswers[iIndex];
                const oControl = aAnswerControls[iIndex];
                
                // Find wrong answers that are not yet crossed out (enabled)
                if (!oAnswer.correct && oControl.getEnabled()) {
                    aWrongIndices.push(iIndex);
                }
            }

            if (aWrongIndices.length > 0) {
                // Select a random wrong answer index
                const nRandomListIndex = Math.floor(Math.random() * aWrongIndices.length);
                const nTargetIndex = aWrongIndices[nRandomListIndex];
                const oTargetControl = aAnswerControls[nTargetIndex];

                // Disable and cross out the selected wrong answer control
                oTargetControl.addStyleClass(c_sCSS_CLASS_CROSSED_OUT);
                oTargetControl.setEnabled(false);
                oTargetControl.setSelected(false);
            }

            // Disable the hint button after it has been used
            if (oBtnHint) {
                oBtnHint.setEnabled(false);
            }
        }
    };
});
