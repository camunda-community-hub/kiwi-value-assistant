// -----------------------------------------------------------
//
// ReviewRules
//
// Displays the review rules for a selected helm version
//
// -----------------------------------------------------------

import React from 'react';
import ControllerPage from "../component/ControllerPage";
import {
    Accordion,
    AccordionItem,
    Button,
    CodeSnippet,
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

const LEVEL_TAG = {
    WARNING:       "red",
    INFO:          "blue",
    CLARIFICATION: "purple",
    ERROR:         "high-contrast",
};

const LEVEL_ICON = {
    WARNING:       "⚠",
    INFO:          "ℹ",
    CLARIFICATION: "?",
};

class ReviewRules extends React.Component {

    constructor(_props) {
        super();
        this.state = {
            status: "",
            display: {
                version: "",
                loading: false
            },
            result: null,
            rawResult: null,
            helmVersions: [],
        };
    }

    componentDidMount() {
        this.fetchVersions();
    }

    render() {
        const { result, rawResult } = this.state;
        // ruleGroups is a plain object (map), not an array
        const ruleGroups = result ? Object.entries(result.ruleGroups ?? {}) : [];

        return (
            <div className="container">
                <h1 className="title">Review Rules</h1>

                <div className="row" style={{width: "100%"}}>
                    <div className="col-md-12">
                        <ControllerPage errorMessage={this.state.status} loading={this.state.display.loading}/>
                    </div>
                </div>

                {/* ── Version selector ───────────────────────────────────── */}
                <div className="row" style={{width: "100%"}}>
                    <div className="col-md-6">
                        <Select
                            id="template-select"
                            labelText="Helm Version"
                            value={this.state.display.version}
                            disabled={this.state.display.loading}
                            onChange={(event) => this.setVersion(event.target.value)}
                        >
                            {this.state.helmVersions.map((v) => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="row" style={{width: "100%", paddingTop: 10}}>
                    <div className="col-md-6">
                        <Button onClick={() => this.loadRule()}
                                disabled={this.state.display.loading}>Get rule</Button>
                    </div>
                </div>

                {result && (<>

                    {/* ── 1. Rule groups ─────────────────────────────────────── */}
                    <div className="row" style={{width: "100%", paddingTop: 20}}>
                        <div className="col-md-12">
                            <h2>
                                Rule Groups&nbsp;
                                <Tag type="gray" size="sm">{ruleGroups.length}</Tag>
                            </h2>
                            <Accordion>
                                {ruleGroups.map(([groupKey, group]) => {
                                    const rules = Object.entries(group.rules ?? {});
                                    return (
                                        <AccordionItem
                                            key={groupKey}
                                            title={
                                                <span style={{display: "flex", alignItems: "center", gap: 8}}>
                                                    <strong>{group.name}</strong>
                                                    <Tag type="gray" size="sm">{rules.length}</Tag>
                                                </span>
                                            }
                                            subtitle={group.description}
                                        >
                                            <Table size="sm" useZebraStyles style={{width: "100%"}}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableHeader style={{width: "8%"}}>Level</TableHeader>
                                                        <TableHeader style={{width: "25%"}}>Comment</TableHeader>
                                                        <TableHeader style={{width: "30%"}}>Expression</TableHeader>
                                                        <TableHeader style={{width: "12%"}}>Versions</TableHeader>
                                                        <TableHeader style={{width: "25%"}}>Expected value</TableHeader>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {rules.map(([ruleKey, rule]) => (
                                                        <TableRow key={ruleKey}>

                                                            {/* Level */}
                                                            <TableCell>
                                                                <Tag type={LEVEL_TAG[rule.level] ?? "gray"} size="sm">
                                                                    <span style={{fontSize: "0.75em", whiteSpace: "nowrap"}}>
                                                                        {LEVEL_ICON[rule.level]} {rule.level}
                                                                    </span>
                                                                </Tag>
                                                            </TableCell>

                                                            {/* Comment + description + links */}
                                                            <TableCell>
                                                                <div>{rule.comment}</div>
                                                                {rule.description && (
                                                                    <div style={{fontSize: "0.85em", color: "#6f6f6f", marginTop: 4}}>
                                                                        {rule.description}
                                                                    </div>
                                                                )}
                                                                {rule.links && rule.links.length > 0 && (
                                                                    <div style={{marginTop: 4}}>
                                                                        {rule.links.map((link, i) => (
                                                                            <a key={i} href={link} target="_blank"
                                                                               rel="noopener noreferrer"
                                                                               style={{display: "block", fontSize: "0.8em"}}>
                                                                                [{i + 1}]
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </TableCell>

                                                            {/* Expression */}
                                                            <TableCell style={{fontFamily: "monospace", fontSize: "0.82em"}}>
                                                                {rule.expression}
                                                            </TableCell>

                                                            {/* Applied versions */}
                                                            <TableCell style={{fontSize: "0.85em"}}>
                                                                {(rule.appliedVersions ?? []).join(", ")}
                                                            </TableCell>

                                                            {/* Expected value */}
                                                            <TableCell>
                                                                {rule.expectedValue
                                                                    ? <pre style={{fontSize: 11, margin: 0, whiteSpace: "pre-wrap"}}>{rule.expectedValue}</pre>
                                                                    : "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </div>
                    </div>

                    {/* ── 2. Content (collapsible) ───────────────────────────── */}
                    <div className="row" style={{width: "100%", paddingTop: 16}}>
                        <div className="col-md-12">
                            <Accordion>
                                <AccordionItem
                                    key="content"
                                    title={<strong>Content</strong>}
                                    subtitle="Full rule definition"
                                >
                                    <CodeSnippet
                                        type="multi"
                                        feedback="Copied!"
                                        wrapText>
                                        {rawResult}
                                    </CodeSnippet>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                </>)}
            </div>
        );
    }

    setVersion(value) {
        this.setDisplayProperty("version", value);
    }

    fetchVersions() {
        let url = '/matrix/api/v1/versions?';
        let restCallService = RestCallService.getInstance();
        this.setDisplayProperty("loading", true);
        restCallService.getJson(url, this, this.fetchVersionCallback);
    }

    fetchVersionCallback(httpResponse) {
        this.setDisplayProperty("loading", false);
        if (httpResponse.isError()) {
            this.setState({status: httpResponse.getError()});
        } else {
            const versions = httpResponse.getData();
            const firstValue = versions.length > 0 ? versions[0].value : this.state.display.version;
            this.setState({status: "", helmVersions: versions});
            this.setDisplayProperty("version", firstValue);
        }
    }

    loadRule() {
        console.log("loadRule version [" + this.state.display.version + "]");
        let url = '/reviewer/api/v1/rule/content?version=' + this.state.display.version;
        console.log("URL: " + url);
        let restCallService = RestCallService.getInstance();
        this.setDisplayProperty("loading", true);
        restCallService.getJson(url, this, this.loadRuleCallback);
    }

    loadRuleCallback(httpResponse) {
        console.log("loadRuleCallback start");
        this.setDisplayProperty("loading", false);
        if (httpResponse.isError()) {
            console.log("ReviewRules.loadRuleCallback: error " + httpResponse.getError());
            this.setState({status: httpResponse.getError()});
        } else {
            const data = httpResponse.getData();
            this.setState({
                status: "",
                result: data,
                rawResult: JSON.stringify(data, null, 2)
            });
        }
    }

    setDisplayProperty(propertyName, propertyValue) {
        let displayObject = this.state.display;
        displayObject[propertyName] = propertyValue;
        this.setState({display: displayObject});
    }
}

export default ReviewRules;
