// -----------------------------------------------------------
//
// UpgraderRules
//
// List of all runners available
//
// -----------------------------------------------------------

import React from 'react';
import ControllerPage from "../component/ControllerPage";
import {
    Accordion,
    AccordionItem,
    Button,
    FileUploaderDropContainer,
    FileUploaderItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tag
} from "carbon-components-react";

import RestCallService from "../services/RestCallService";

// ── EN DEHORS de la classe ───────────────────────────────────────────────────
const LEVEL_TAG = {
    WARNING: "red",
    INFO: "blue",
    CLARIFICATION: "purple",
    ERROR: "high-contrast",
};

const LEVEL_ICON = {
    WARNING: "⚠",
    INFO: "ℹ",
    CLARIFICATION: "?",
};

// ── Classe principale ────────────────────────────────────────────────────────
class Review extends React.Component {

    constructor(_props) {
        super();
        this.state = {
            status: "",
            display: {
                version: "14.2.0",
                loading: false,
            },
            helmVersions: [],
            result: "",
            openGroups: {}
        };
    }

    componentDidMount() {
        this.fetchVersions();
    }

    render() {
        const groups = this.state.result?.rulesEvaluation ?? [];
        const executionInformations = this.state.result?.executionInformations ?? [];

        const countLevel = (level) => groups.reduce((sum, g) =>
            sum +
            (g.results?.filter(r => !r.followed && r.level === level).length ?? 0) +
            (g.informations?.filter(i => i.level === level).length ?? 0), 0);
        const errorCount         = countLevel("ERROR");
        const warningCount       = countLevel("WARNING");
        const clarificationCount = countLevel("CLARIFICATION");
        const infoCount          = countLevel("INFO");

        return (
            <div className={"container"}>
                <div className="row">
                    <div className="col-md-12">
                        <h1 className="title">Reviewer</h1>
                    </div>
                    <div className="row" style={{width: "100%"}}>
                        <div className="col-md-12">
                            <ControllerPage errorMessage={this.state.status} loading={this.state.display.loading}/>
                        </div>
                    </div>
                </div>

                <div className="row" style={{width: "100%"}}>
                    <div className="col-md-6">
                        <p className="bx--label-description">Drag and drop a .yaml file here</p>
                        <FileUploaderDropContainer
                            labelText="Drag and drop a .yaml file or click to upload"
                            accept={['.yaml']}
                            multiple={false}
                            disabled={this.state.display.loading}
                            onAddFiles={(event, {addedFiles}) => this.handleDropFiles(addedFiles)}
                        />
                        {this.state.droppedFiles && this.state.droppedFiles.map((file) => (
                            <FileUploaderItem
                                key={file.name}
                                name={file.name}
                                status="edit"
                                iconDescription="Remove file"
                                onDelete={() => this.handleDropFileDelete(file.name)}
                            />
                        ))}

                        {this.state.statusUploadFailed &&
                            <div className="alert alert-danger" style={{margin: "10px 10px 10px 10px"}}>
                                {this.state.statusUploadFailed}
                            </div>
                        }
                        {this.state.statusUploadSuccess &&
                            <div className="alert alert-success" style={{margin: "10px 10px 10px 10px"}}>
                                {this.state.statusUploadSuccess}
                            </div>
                        }
                    </div>

                    <div className="col-md-6">
                        <Select
                            id="template-select"
                            labelText="Helm version"
                            value={this.state.display.version}
                            onChange={(event) => this.setVersion(event.target.value)}
                        >
                            {this.state.helmVersions.map((v) => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                        </Select>
                        <br/>
                        <a href="https://helm.camunda.io/camunda-platform/version-matrix/">Matrix</a>
                    </div>
                </div>

                <div className="row" style={{width: "100%", paddingTop: "10px"}}>
                    <div className="col-md-12">
                        <Button onClick={() => this.review()}
                                disabled={this.state.display.loading}>Review</Button>
                    </div>
                </div>

                <div className="row" style={{width: "100%"}}>
                    <div className="col-md-12">
                        <h2>Result</h2>

                        {(executionInformations.length > 0 || groups.length > 0) && (
                            <Accordion>

                                {/* ── Section 1 : Execution ───────────────────────── */}
                                <AccordionItem
                                    title={
                                        <span style={{display: "flex", alignItems: "center", gap: 8}}>
                                            <strong>Execution</strong>
                                            <Tag type={executionInformations.some(i => i.level === "WARNING" || i.level === "ERROR") ? "red" : "gray"}
                                                 size="sm">
                                                {executionInformations.length}
                                            </Tag>
                                        </span>
                                    }
                                    subtitle="Analysis execution details"
                                >
                                    {executionInformations.length > 0 ? (
                                        <Table size="sm" useZebraStyles style={{width: "100%"}}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableHeader style={{width: "10%"}}>Level</TableHeader>
                                                    <TableHeader>Message</TableHeader>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {executionInformations.map((info, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>
                                                            <Tag type={LEVEL_TAG[info.level] ?? "gray"} size="sm">
                                                                <span style={{fontSize: "0.75em", textTransform: "lowercase", whiteSpace: "nowrap"}}>
                                                                    {LEVEL_ICON[info.level]} {info.level}
                                                                </span>
                                                            </Tag>
                                                        </TableCell>
                                                        <TableCell>{info.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p style={{color: "#6f6f6f", margin: "8px 0"}}>No execution information.</p>
                                    )}
                                </AccordionItem>

                                {/* ── Section 2 : Analysis ────────────────────────── */}
                                <AccordionItem
                                    title={
                                        <span style={{display: "flex", alignItems: "center", gap: 8}}>
                                            <strong>Analysis</strong>
                                            <Tag type={groups.some(g =>
                                                    g.results?.some(r => !r.followed && (r.level === "WARNING" || r.level === "ERROR")) ||
                                                    g.informations?.some(i => i.level === "WARNING" || i.level === "ERROR")
                                                ) ? "red" : "gray"}
                                                 size="sm">
                                                {errorCount + warningCount + clarificationCount + infoCount}
                                            </Tag>
                                        </span>
                                    }
                                    subtitle="Rule evaluation results"
                                >
                                    <span style={{fontWeight: "bold", fontSize: "0.8em", margin: "5px 5px 5px 5px", display: "block"}}>
                                        {errorCount} error{errorCount !== 1 ? "s" : ""}, {warningCount} warning{warningCount !== 1 ? "s" : ""}, {clarificationCount} clarification{clarificationCount !== 1 ? "s" : ""}, {infoCount} info
                                    </span>

                                    {groups.length > 0 ? (
                                        <div style={{borderTop: "1px solid #e0e0e0"}}>
                                            {groups.map((group) => {
                                                const isOpen = this.state.openGroups[group.id] ?? false;
                                                const count  = (group.results?.length ?? 0) + (group.informations?.length ?? 0);
                                                const hasError =
                                                    group.results?.some(r => !r.followed && (r.level === "WARNING" || r.level === "ERROR")) ||
                                                    group.informations?.some(i => i.level === "WARNING" || i.level === "ERROR");
                                                return (
                                                    <div key={group.id} style={{borderBottom: "1px solid #e0e0e0"}}>

                                                        {/* ── Clickable header ── */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); this.toggleGroup(group.id); }}
                                                            style={{
                                                                width: "100%", textAlign: "left", background: "none",
                                                                border: "none", cursor: "pointer", padding: "12px 16px",
                                                                display: "flex", alignItems: "center", gap: 8
                                                            }}
                                                        >
                                                            <span style={{fontSize: "0.75em", marginRight: 4}}>{isOpen ? "▼" : "▶"}</span>
                                                            <strong>{group.name}</strong>
                                                            <Tag type={hasError ? "red" : "gray"} size="sm">{count}</Tag>
                                                            {group.description && (
                                                                <span style={{fontSize: "0.8em", color: "#6f6f6f", fontWeight: "normal"}}>
                                                                    — {group.description}
                                                                </span>
                                                            )}
                                                        </button>

                                                        {/* ── Collapsible content ── */}
                                                        {isOpen && (
                                                            <div style={{padding: "0 16px 16px"}}>

                                                                {/* Results table */}
                                                                {group.results && group.results.length > 0 && (
                                                                    <Table size="sm" useZebraStyles style={{width: "100%"}}>
                                                                        <TableHead>
                                                                            <TableRow>
                                                                                <TableHeader style={{width: "8%"}}>Level</TableHeader>
                                                                                <TableHeader style={{width: "8%"}}>Status</TableHeader>
                                                                                <TableHeader style={{width: "30%"}}>Comment</TableHeader>
                                                                                <TableHeader style={{width: "46%"}}>Value</TableHeader>
                                                                                <TableHeader style={{width: "8%"}}>Links</TableHeader>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {group.results.map((rule) => (
                                                                                <TableRow key={rule.ruleName}>
                                                                                    <TableCell>
                                                                                        <Tag type={LEVEL_TAG[rule.level] ?? "gray"}>
                                                                                            <span style={{fontSize: "0.75em", textTransform: "lowercase", whiteSpace: "nowrap"}}>
                                                                                                {LEVEL_ICON[rule.level]} {rule.level}
                                                                                            </span>
                                                                                        </Tag>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Tag type={rule.followed ? "green" : "red"} size="sm">
                                                                                            <span style={{fontSize: "0.75em", textTransform: "lowercase", whiteSpace: "nowrap"}}>
                                                                                                {rule.followed ? "✔ OK" : "✘ Missing"}
                                                                                            </span>
                                                                                        </Tag>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div>{rule.comment}</div>
                                                                                        {rule.description && (
                                                                                            <div style={{fontSize: "0.85em", color: "#6f6f6f", marginTop: 4}}>
                                                                                                {rule.description}
                                                                                            </div>
                                                                                        )}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <pre style={{fontSize: 11, margin: 0}}>
                                                                                            {rule.details?.expectedValue ?? rule.details?.unexpectedValue ?? "—"}
                                                                                        </pre>
                                                                                    </TableCell>
                                                                                    <TableCell style={{whiteSpace: "nowrap"}}>
                                                                                        {rule.links && rule.links.map((link, i) => (
                                                                                            <a key={i} href={link} target="_blank"
                                                                                               rel="noopener noreferrer"
                                                                                               style={{display: "block", fontSize: "0.8em"}}>
                                                                                                [{i + 1}]
                                                                                            </a>
                                                                                        ))}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                )}

                                                                {/* Informations table */}
                                                                {group.informations && group.informations.length > 0 && (
                                                                    <Table size="sm" useZebraStyles style={{width: "100%"}}>
                                                                        <TableHead>
                                                                            <TableRow>
                                                                                <TableHeader style={{width: "10%"}}>Level</TableHeader>
                                                                                <TableHeader>Message</TableHeader>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {group.informations.map((info, i) => (
                                                                                <TableRow key={i}>
                                                                                    <TableCell>
                                                                                        <Tag type={LEVEL_TAG[info.level] ?? "gray"} size="sm">
                                                                                            <span style={{fontSize: "0.75em", textTransform: "lowercase", whiteSpace: "nowrap"}}>
                                                                                                {LEVEL_ICON[info.level]} {info.level}
                                                                                            </span>
                                                                                        </Tag>
                                                                                    </TableCell>
                                                                                    <TableCell>{info.message}</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                )}

                                                                {/* Empty state */}
                                                                {(!group.results || group.results.length === 0) &&
                                                                 (!group.informations || group.informations.length === 0) && (
                                                                    <p style={{color: "#6f6f6f", margin: "8px 0"}}>No findings.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p style={{color: "#6f6f6f", margin: "8px 0"}}>No analysis results.</p>
                                    )}
                                </AccordionItem>

                            </Accordion>
                        )}
                    </div>
                </div>

            </div>
        );
    }

    toggleGroup(groupId) {
        this.setState(prev => ({
            openGroups: {
                ...prev.openGroups,
                [groupId]: !(prev.openGroups[groupId] ?? false)
            }
        }));
    }

    setVersion(value) {
        this.setDisplayProperty("version", value);
    }

    handleFileChange(event) {
        this.refreshStatusOnPage();
        const fileList = event.target.files;
        this.setState({files: fileList});
    }

    handleDropFiles(addedFiles) {
        this.refreshStatusOnPage();
        const singleFile = [addedFiles[0]];
        this.setState({droppedFiles: singleFile, files: singleFile});
    }

    handleDropFileDelete(fileName) {
        this.setState((prev) => {
            const updated = (prev.droppedFiles || []).filter((f) => f.name !== fileName);
            return {droppedFiles: updated, files: updated};
        });
    }

    review() {
        console.log("review version [" + this.state.display.version);
        if (!this.state.files || this.state.files.length === 0) {
            this.setState({status: "Please upload a file to review", result: {}});
            return;
        }

        let url = '/reviewer/api/v1/analysis?version=' + this.state.display.version;
        console.log("URL: " + url);

        let restCallService = RestCallService.getInstance();
        this.setDisplayProperty("loading", true);

        const formData = new FormData();
        Array.from(this.state.files).forEach((file) => {
            formData.append(`File`, file);
        });
        restCallService.postUpload(url, formData, this, this.reviewCallback);
    }

    reviewCallback(httpResponse) {
        console.log("loadRuleCallback start");
        this.setDisplayProperty("loading", false);

        if (httpResponse.isError()) {
            console.log("UpgraderRules.loadRuleCallback: error " + httpResponse.getError());
            this.setState({status: httpResponse.getError(), result: {}});
        } else {
            this.setState({status: "", result: httpResponse.getData()});
        }
    }

    fetchVersions() {
        console.log("FetchVersions ");
        let url = '/matrix/api/v1/versions?';
        console.log("URL: " + url);

        let restCallService = RestCallService.getInstance();
        this.setDisplayProperty("loading", true);
        restCallService.getJson(url, this, this.fetchVersionCallback);
    }

    fetchVersionCallback(httpResponse) {
        console.log("fetchVersionCallback start");
        this.setDisplayProperty("loading", false);

        if (httpResponse.isError()) {
            console.log("UpgraderRules.loadRuleCallback: error " + httpResponse.getError());
            this.setState({status: httpResponse.getError()});
        } else {
            const versions = httpResponse.getData();
            const firstValue = versions.length > 0 ? versions[0].value : this.state.display.version;
            this.setState({status: "", helmVersions: versions});
            this.setDisplayProperty("version", firstValue);
        }
    }

    setDisplayProperty(propertyName, propertyValue) {
        let displayObject = this.state.display;
        displayObject[propertyName] = propertyValue;
        this.setState({display: displayObject});
    }

    refreshStatusOnPage() {
        this.setState({statusUploadFailed: '', statusUploadSuccess: '', status: ''});
    }
}

export default Review;
