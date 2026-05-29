package io.camunda.kiwi.reviewer.review;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * This class collect information during the review
 */
public class CollectorInformation {
    private static final Logger logger = LoggerFactory.getLogger(CollectorInformation.class);
    List<ExecutionInformation> informations = new ArrayList<>();
    private final Set<String> keys = new HashSet<>();

    public void report(LEVEL level, String message) {
        if (level == LEVEL.ERROR) {
            logger.error(message);
        } else {
            logger.info(message);
        }
        informations.add(new ExecutionInformation(level, message));
    }

    public void reportUniqKey(String key, LEVEL level, String message) {
        if (containsKey(key))
            return;
        addKey(key);
        if (level == LEVEL.ERROR) {
            logger.error(message);
        } else {
            logger.info(message);
        }
        informations.add(new ExecutionInformation(level, message));
    }

    public List<ExecutionInformation> getInformations() {
        return informations;
    }

    public void addKey(String key) {
        keys.add(key);
    }

    public boolean containsKey(String key) {
        return keys.contains(key);
    }

    public enum LEVEL {ERROR, WARNING, INFO}
}
