package io.camunda.kiwi.reviewer.controller;

import io.camunda.kiwi.reviewer.ReviewProperties;
import io.camunda.kiwi.reviewer.rule.RuleReviewFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reviewer/api/v1")

public class ReviewerRuleController {
    private final RuleReviewFactory ruleReviewFactory;
    Logger logger = LoggerFactory.getLogger(ReviewerRuleController.class.getName());

    public ReviewerRuleController(RuleReviewFactory ruleReviewFactory) {
        this.ruleReviewFactory = ruleReviewFactory;
    }

    @GetMapping("/rule/content")
    public ResponseEntity<ReviewProperties> ruleContent(
            @RequestParam(name = "version", required = true) String helmVersion) {

        logger.info("get HelmVersion[{}]", helmVersion);
        try {
            ReviewProperties reviewProperties = ruleReviewFactory.getReviewProperties(helmVersion);

            return ResponseEntity.ok(reviewProperties);

        } catch (Exception e) {
            logger.error("reviewValues version [{}] :", helmVersion, e);
            return ResponseEntity.badRequest().build();
        }

    }

}
