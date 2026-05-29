package io.camunda.kiwi.upgrader.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import io.camunda.kiwi.upgrader.rule.RuleUpgradeFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/upgrader/api/v1")

public class UpgraderRuleController {
    private final RuleUpgradeFactory ruleUpgradeFactory;
    private final YAMLMapper yamlMapper = new YAMLMapper();
    private final ObjectMapper jsonMapper = new ObjectMapper();
    Logger logger = LoggerFactory.getLogger(UpgraderRuleController.class.getName());

    public UpgraderRuleController(RuleUpgradeFactory ruleFactor) {
        this.ruleUpgradeFactory = ruleFactor;
    }

    @GetMapping("/rule/content")
    public ResponseEntity<String> migrate(@RequestParam(name = "version") String version) {
        RuleUpgradeFactory.VERSION versionToTransform;
        try {
            versionToTransform = RuleUpgradeFactory.VERSION.valueOf(version);
        } catch (Exception e) {
            logger.error("Can't convert [{}] to VERSION. [{},{}] expected", version,
                    RuleUpgradeFactory.VERSION.V87_88,
                    RuleUpgradeFactory.VERSION.V88_89);
            return ResponseEntity.badRequest().build();
        }
        String yamlRule = ruleUpgradeFactory.getRule(versionToTransform);
        try {
            Object parsed = yamlMapper.readValue(yamlRule, Object.class);
            String jsonString = jsonMapper.writeValueAsString(parsed);
            return ResponseEntity.ok(jsonString);
        } catch (Exception e) {
            logger.error("Cannot convert YAML rule to JSON for version {}: {}", version, e.getMessage());
            return ResponseEntity.ok(yamlRule);
        }
    }

}
