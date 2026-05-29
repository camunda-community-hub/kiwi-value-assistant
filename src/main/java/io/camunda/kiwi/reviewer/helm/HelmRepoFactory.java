package io.camunda.kiwi.reviewer.helm;

import com.marcnuri.helm.Helm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class HelmRepoFactory {
    private static final Logger logger = LoggerFactory.getLogger(HelmRepoFactory.class);

    HelmConfig helmConfig;
    private final Map<String, HelmRepo> cacheHelmRepos = new HashMap<>();


    public HelmRepoFactory() {
        this.helmConfig = helmConfig;
    }

    public void addRepo(HelmRepoProperties helmRepoProperties) {
        cacheHelmRepos.put(helmRepoProperties.repoName(), new HelmRepo(helmRepoProperties, false));
    }

    public HelmRepo findHelmRepoByName(String repoName, boolean updateRepository) {
        HelmRepo helmRepo = cacheHelmRepos.get(repoName);
        if (helmRepo != null && updateRepository) {
            updateRepo(helmRepo);
        }
        return helmRepo;
    }

    public HelmRepo findHelmRepoByUrl(String repoUrl, boolean updateRepository) {
        Optional<HelmRepo> helmRepoFind = cacheHelmRepos.values().stream()
                .filter(helmRepo ->
                        helmRepo.helmRepoProperties.url().toString().equals(repoUrl)
                                || (helmRepo.helmRepoProperties.alternativeRepoNames() != null
                                && helmRepo.helmRepoProperties.alternativeRepoNames().stream()
                                .anyMatch(alternativeUrl -> alternativeUrl.toString().equals(repoUrl))))
                .findFirst();
        if (helmRepoFind.isPresent() && updateRepository) {
            updateRepo(helmRepoFind.get());
        }
        return helmRepoFind.isPresent() ? helmRepoFind.get() : null;
    }

    public void updateRepo(HelmRepo helmRepo) {
        if (helmRepo.isReady)
            return;

        logger.info("Updating Repo[{}]", helmRepo.getRepoName());

        try {

            Helm.repo().add()
                    .withName(helmRepo.getRepoName())
                    .withUrl(helmRepo.getUrl())
                    .call();
            logger.debug("UpdatingRepo[{}]: repo added with success", helmRepo.getRepoName());
        } catch (Exception e) {
            // maybe the repo already exist
            if (!e.getMessage().contains("already exists")) {
                logger.error("Error while adding repo[{}]", helmRepo.getRepoName(), e);
                throw new IllegalStateException("Failed to add Helm repo", e);
            }
            logger.debug("Repo[{}] already exists, skipping add", helmRepo.getRepoName());
        }

        try {
            Helm.repo().update().call();
            helmRepo.isReady = true;
            logger.info("Repo[{}] updated and ready", helmRepo.getRepoName());
        } catch (Exception e) {
            logger.error("Error while updating repo[{}]", helmRepo.getRepoName(), e);
            throw new IllegalStateException("Failed to update Helm repo", e);
        }
    }

    public static class HelmRepo {
        public HelmRepoProperties helmRepoProperties;
        public boolean isReady;

        public HelmRepo(HelmRepoProperties helmRepoProperties, boolean isReady) {
            this.helmRepoProperties = helmRepoProperties;
            this.isReady = isReady;
        }

        public String getRepoName() {
            return helmRepoProperties.repoName();
        }

        public URI getUrl() {
            return helmRepoProperties.url();
        }
    }
}
