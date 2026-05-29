package io.camunda.kiwi.reviewer.helm;

import io.camunda.kiwi.reviewer.ReviewProperties;

import java.util.List;


public class HelmConfig {
    private final ReviewProperties reviewProperties;

    public HelmConfig(ReviewProperties reviewProperties) {
        this.reviewProperties = reviewProperties;
    }

    public List<HelmRepoProperties> getRepos() {
        return reviewProperties.helmRepos();
    }

}
