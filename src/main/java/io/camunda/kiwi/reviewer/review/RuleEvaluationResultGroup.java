package io.camunda.kiwi.reviewer.review;

import java.util.List;

public record RuleEvaluationResultGroup(
        String id, String name, String description, List<RuleEvaluationResult> results,
        List<ExecutionInformation> listInformation) {
}
