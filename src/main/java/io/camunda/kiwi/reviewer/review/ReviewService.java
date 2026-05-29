package io.camunda.kiwi.reviewer.review;

import io.camunda.kiwi.reviewer.NestedMapUtil;
import io.camunda.kiwi.reviewer.ReviewProperties;
import io.camunda.kiwi.reviewer.VersionRangeParser;
import io.camunda.kiwi.reviewer.helm.HelmRepoFactory;
import io.camunda.kiwi.reviewer.helm.HelmRepoProperties;
import io.camunda.kiwi.reviewer.helm.HelmService;
import io.camunda.kiwi.reviewer.rule.RuleReviewFactory;
import org.camunda.feel.api.FeelEngineApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ReviewService {

    public static final String DEFAULT_VALUES_GROUP_ID = "default-values";
    public static final String NON_EXISTING_VALUES_GROUP_ID = "non-existing-values";
    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);
    private final VersionRangeParser versionRangeParser;
    private final HelmService helmService;
    private final FeelEngineApi feelEngine;
    private final RuleReviewFactory ruleReviewFactory;
    private final HelmRepoFactory helmRepoFactory;

    public ReviewService(
            VersionRangeParser versionRangeParser,
            RuleReviewFactory ruleReviewFactory,
            HelmService helmService,
            FeelEngineApi feelEngine, HelmRepoFactory helmRepoFactory) {
        this.versionRangeParser = versionRangeParser;
        this.ruleReviewFactory = ruleReviewFactory;
        this.helmService = helmService;
        this.feelEngine = feelEngine;
        this.helmRepoFactory = helmRepoFactory;
    }

    @SafeVarargs
    public final ReviewReponse reviewValues(String helmVersion, Map<String, Object>... valuesUnmerged) {
        Map<String, Object> values = NestedMapUtil.merge(valuesUnmerged);
        ReviewProperties reviewProperties = ruleReviewFactory.getReviewProperties(helmVersion);
        List<Pattern> wildcardProperties = reviewProperties.wildcardProperties().stream().map(Pattern::compile).toList();

        // Load helmService with repos
        for (HelmRepoProperties helmRepo : reviewProperties.helmRepos()) {
            helmRepoFactory.addRepo(helmRepo);
        }


        ReviewExecution reviewExecution = new ReviewExecution(versionRangeParser,
                reviewProperties,
                helmService,
                feelEngine);
        return reviewExecution.reviewValues(helmVersion, valuesUnmerged);

    }


    public Map<String, Object> getNonDefaultValues(String helmVersion, Map<String, Object> values, CollectorInformation collectorInformation) {
        ReviewProperties reviewProperties = ruleReviewFactory.getReviewProperties(helmVersion);
        List<Pattern> wildcardProperties = reviewProperties.wildcardProperties().stream().map(Pattern::compile).toList();

        ReviewExecution reviewExecution = new ReviewExecution(versionRangeParser,
                reviewProperties,
                helmService,
                feelEngine);
        return reviewExecution.getNonDefaultValues(helmVersion, values, collectorInformation);
    }


    public Map<String, Long> reviewValuesAsBulk(String helmVersion, List<Map<String, Object>> valuesFiles) {
        ReviewProperties reviewProperties = ruleReviewFactory.getReviewProperties(helmVersion);
        List<Pattern> wildcardProperties = reviewProperties.wildcardProperties().stream().map(Pattern::compile).toList();

        ReviewExecution reviewExecution = new ReviewExecution(versionRangeParser,
                reviewProperties,
                helmService,
                feelEngine);
        return reviewExecution.reviewValuesAsBulk(helmVersion, valuesFiles);
    }

}
