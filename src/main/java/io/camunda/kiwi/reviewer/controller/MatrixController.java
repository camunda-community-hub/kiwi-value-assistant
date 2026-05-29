package io.camunda.kiwi.reviewer.controller;

import io.camunda.kiwi.reviewer.review.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/matrix/api/v1")
public class MatrixController {

    private static final Logger logger = LoggerFactory.getLogger(MatrixController.class);
    private static final String VERSION_MATRIX_URL =
            "https://helm.camunda.io/camunda-platform/version-matrix/";

    public MatrixController(ReviewService reviewService) {
    }

    /**
     * Fetches all Helm chart versions from the Camunda version matrix page.
     * Each entry is a map with:
     * "value" — Helm chart version, e.g. "14.2.0"
     * "label" — human-readable label,  e.g. "14.2.0 - Camunda 8.9"
     * <p>
     * The page contains markdown links like:
     * ### [Helm chart 14.2.0](https://helm.camunda.io/.../camunda-8.9/#helm-chart-1420)
     * Both the Helm version and the Camunda version are captured in a single regex pass.
     */
    public static List<Map<String, Object>> fetchHelmChartVersions() throws IOException, InterruptedException {

        HttpClient client = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(VERSION_MATRIX_URL))
                .header("User-Agent", "Mozilla/5.0")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IOException("HTTP error: " + response.statusCode());
        }

        String html = response.body();

        // The page is rendered HTML: "Helm chart 14.2.0" appears as text content,
        // not adjacent to the URL. Capture only the Helm version; derive the
        // Camunda version from the major number (helmMajor - 5 = camundaMinor, valid for >= 10).
        Pattern pattern = Pattern.compile(
                "Helm chart\\s+([0-9]+\\.[0-9]+\\.[0-9]+(?:-[a-zA-Z0-9.]+)?)"
        );

        Matcher matcher = pattern.matcher(html);
        List<Map<String, Object>> versions = new ArrayList<>();

        while (matcher.find()) {
            String helmVersion = matcher.group(1);
            String camundaVersion = camundaVersionFromHelm(helmVersion);
            Map<String, Object> entry = new HashMap<>();
            entry.put("value", helmVersion);
            entry.put("label", camundaVersion != null
                    ? helmVersion + " - Camunda " + camundaVersion
                    : helmVersion);
            versions.add(entry);
        }

        return versions;
    }

    /**
     * Derives the Camunda version string from the Helm chart major version.
     * <p>
     * Alignment (see https://helm.camunda.io/camunda-platform/version-matrix/):
     * Helm 10.x → Camunda 8.5
     * Helm 11.x → Camunda 8.6
     * Helm 12.x → Camunda 8.7
     * Helm 13.x → Camunda 8.8
     * Helm 14.x → Camunda 8.9
     * …
     * Formula: camundaMinor = helmMajor - 5  (valid for helmMajor >= 10)
     */
    private static String camundaVersionFromHelm(String helmVersion) {
        try {
            int major = Integer.parseInt(helmVersion.split("\\.")[0]);
            if (major >= 10) {
                return "8." + (major - 5);
            }
        } catch (NumberFormatException ignored) {
        }
        return null;
    }

    @GetMapping("/versions")
    public ResponseEntity<List<Map<String, Object>>> matrix() {
        try {
            List<Map<String, Object>> listVersions = fetchHelmChartVersions();

            listVersions = listVersions.stream()
                    .filter(v -> !((String) v.get("value")).contains("alpha"))
                    .toList();
            logger.info("Matrix: {}", listVersions);
            return ResponseEntity.ok(listVersions);

        } catch (Exception e) {
            logger.error("Can't get Matrix", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
