// -----------------------------------------------------------
//
// UpgraderRules
//
// Displays the upgrade rules for a selected version
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

// Tag color per rule type
const RULE_TYPE_TAG = {
    'move':          'green',
    'retype':        'blue',
    'delete':        'red',
    'merge-to-list': 'teal',
    'notify':        'purple',
    'set-default':   'cyan',
};

class UpgraderRules extends React.Component {

    constructor(_props) {
        super();
        this.state = {
            status: "",
            display: {
                version: "V87_88",
                loading: false
            },
            result: null,
            rawResult: null
        };
    }

    componentDidMount() {}

    render() {
        const { result } = this.state;
        const rules = result?.rules ?? [];

        return (
            <div className="container">
                <h1 className="title">Upgrader Rules</h1>

                <div className="row" style={{width: "100%"}}>
                    <div className="col-md-12">
                        <ControllerPage errorMessage={this.state.status} loading={this.state.display.loading}/>
                    </div>
                </div>

                {/* ── Version selector ─────────────────────────────────── */}
                <div className="row" style={{width: "100%"}}>
                    <div className="col-md-6">
                        <Select
                            value={this.state.display.version}
                            labelText="Version"
                            disabled={this.state.display.loading}
                            onChange={(event) => this.setVersion(event.target.value)}>
                            <option value="V87_88">8.7 to 8.8</option>
                            <option value="V88_89">8.8 to 8.9</option>
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

                    {/* ── 1. Metadata ──────────────────────────────────────── */}
                    <div className="row" style={{width: "100%", paddingTop: 20}}>
                        <div className="col-md-12">
                            <h2>Rule</h2>
                            <Table size="sm" style={{width: "auto", minWidth: 400}}>
                                <TableBody>
                                    <TableRow>
                                        <TableHeader style={{width: 130}}>Version</TableHeader>
                                        <TableCell>{result.version}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableHeader>Description</TableHeader>
                                        <TableCell>{result.description}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* ── 2. Rules table ───────────────────────────────────── */}
                    <div className="row" style={{width: "100%", paddingTop: 20}}>
                        <div className="col-md-12">
                            <h3 style={{marginBottom: 8}}>
                                Rules&nbsp;
                                <Tag type="gray" size="sm">{rules.length}</Tag>
                            </h3>
                            <Table size="sm" useZebraStyles style={{width: "100%"}}>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader style={{width: "12%"}}>Type</TableHeader>
                                        <TableHeader style={{width: "27%"}}>From / Path</TableHeader>
                                        <TableHeader style={{width: "27%"}}>To / To type</TableHeader>
                                        <TableHeader>Note</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rules.map((rule, i) => (
                                        <TableRow key={i}>

                                            {/* Type */}
                                            <TableCell>
                                                <Tag type={RULE_TYPE_TAG[rule.type] ?? "gray"} size="sm">
                                                    <span style={{fontSize: "0.75em", whiteSpace: "nowrap"}}>
                                                        {rule.type}
                                                    </span>
                                                </Tag>
                                            </TableCell>

                                            {/* From / Path — merge-to-list has an array in `from` */}
                                            <TableCell style={{fontFamily: "monospace", fontSize: "0.85em"}}>
                                                {Array.isArray(rule.from)
                                                    ? rule.from.map((f, j) => <div key={j}>{f}</div>)
                                                    : (rule.from || rule.path || "—")}
                                            </TableCell>

                                            {/* To / To type */}
                                            <TableCell style={{fontFamily: "monospace", fontSize: "0.85em"}}>
                                                {rule.to || rule.to_type || "—"}
                                            </TableCell>

                                            {/* Note: message (notify) | value + description (set-default) | — */}
                                            <TableCell style={{fontSize: "0.85em"}}>
                                                {rule.message
                                                    ? rule.message
                                                    : rule.value !== undefined
                                                        ? <><code>{String(rule.value)}</code>
                                                            {rule.description && <> — {rule.description}</>}</>
                                                        : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* ── 3. Content (collapsible) ─────────────────────────── */}
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
                                        {this.state.rawResult}
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

    loadRule() {
        console.log("loadRule version [" + this.state.display.version + "]");
        let url = '/upgrader/api/v1/rule/content?version=' + this.state.display.version;
        console.log("URL: " + url);
        let restCallService = RestCallService.getInstance();
        this.setDisplayProperty("loading", true);
        restCallService.getJson(url, this, this.loadRuleCallback);
    }

    loadRuleCallback(httpResponse) {
        console.log("loadRuleCallback start");
        this.setDisplayProperty("loading", false);
        if (httpResponse.isError()) {
            console.log("UpgraderRules.loadRuleCallback: error " + httpResponse.getError());
            this.setState({status: httpResponse.getError()});
        } else {
            const data = httpResponse.getData();
            let parsed;
            let rawResult;
            if (typeof data === 'object' && data !== null) {
                // Axios already parsed the JSON response automatically
                parsed = data;
                rawResult = JSON.stringify(data, null, 2);
            } else {
                // data is a string — parse it ourselves
                rawResult = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    console.warn("Could not parse rule response as JSON", e);
                    parsed = null;
                }
            }
            this.setState({status: "", rawResult, result: parsed});
        }
    }

    setDisplayProperty(propertyName, propertyValue) {
        let displayObject = this.state.display;
        displayObject[propertyName] = propertyValue;
        this.setState({display: displayObject});
    }
}

export default UpgraderRules;
