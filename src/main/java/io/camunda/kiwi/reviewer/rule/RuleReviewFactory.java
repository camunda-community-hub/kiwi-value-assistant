package io.camunda.kiwi.reviewer.rule;

import com.fasterxml.jackson.core.Version;
import io.camunda.kiwi.reviewer.ReviewProperties;
import io.camunda.kiwi.reviewer.VersionRange;
import io.camunda.kiwi.reviewer.VersionRangeParser;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@Service
public class RuleReviewFactory {

    VersionRangeParser VersionRangeParser;

    public RuleReviewFactory(VersionRangeParser VersionRangeParser) {
        this.VersionRangeParser = VersionRangeParser;
    }

    private String getRule(VERSION version) {
        String fileName = resolveFileName(version);
        try (InputStream is = new ClassPathResource(fileName).getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot load rules file: " + fileName, e);
        }
    }

    public ReviewProperties getReviewProperties(String helmVersion) {
        VERSION version = getVersionFromHelm(helmVersion);
        String yaml = getRule(version);
        try {
            YamlPropertiesFactoryBean factory = new YamlPropertiesFactoryBean();
            factory.setResources(new ByteArrayResource(yaml.getBytes(StandardCharsets.UTF_8)));
            Properties props = factory.getObject();
            Map<String, Object> map = new HashMap<>();
            props.forEach((k, v) -> map.put(k.toString(), v));
            StandardEnvironment env = new StandardEnvironment();
            env.getPropertySources().addFirst(new MapPropertySource("reviewRules", map));
            return Binder.get(env).bind("review", ReviewProperties.class).get();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot parse review properties from YAML", e);
        }
    }

    private String resolveFileName(VERSION version) {
        return switch (version) {
            case V82 -> "reviewer/camunda-review-82-rules.yaml";
            case V88 -> "reviewer/camunda-review-88-rules.yaml";
        };
    }

    /**
     * see https://helm.camunda.io/camunda-platform/version-matrix/
     * 0 - 12.x : 8.7
     * 13.x > 8.8
     *
     * @param helmVersion
     * @return
     */
    private VERSION getVersionFromHelm(String helmVersion) {
        Version version = VersionRangeParser.parse(helmVersion).as(VersionRange.Equals.class).version();
        if (version.getMajorVersion() <= 12)
            return VERSION.V82;
        return VERSION.V88;
    }

    public enum VERSION {
        V82,
        V88
    }
}
