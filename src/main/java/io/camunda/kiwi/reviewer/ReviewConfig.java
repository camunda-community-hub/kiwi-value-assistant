package io.camunda.kiwi.reviewer;

import io.camunda.kiwi.reviewer.helm.HelmService;
import org.camunda.feel.api.FeelEngineApi;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ReviewConfig {

    private final VersionRangeParser versionRangeParser;
    private final FeelEngineApi feelEngine;
    private final HelmService helmService;

    public ReviewConfig(
            VersionRangeParser versionRangeParser, FeelEngineApi feelEngine, HelmService helmService) {
        this.versionRangeParser = versionRangeParser;
        this.feelEngine = feelEngine;
        this.helmService = helmService;
    }
}
