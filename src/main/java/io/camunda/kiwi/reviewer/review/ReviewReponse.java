package io.camunda.kiwi.reviewer.review;

import java.util.List;

public class ReviewReponse {
    /**
     * The transformed YAML content. Null when dryRun=true.
     */

    public List<RuleEvaluationResultGroup> rulesEvaluation;
    public List<ExecutionInformation> executionInformations;

    public void add(ReviewReponse singleResult) {
        this.rulesEvaluation.addAll(singleResult.rulesEvaluation);
        this.executionInformations.addAll(singleResult.executionInformations);
    }
}
