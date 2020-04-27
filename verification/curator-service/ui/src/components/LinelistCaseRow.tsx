import React from "react";
import { Case } from "../../../api/src/controllers/cases";

interface RowProps {
    case: Case
}

export default class LinelistCaseRow extends React.Component<RowProps, {}> {
    render() {
        const c = this.props.case;
        return (
            <tr>
                <td>{c._id}</td>
                <td>{new Date(c.date).toDateString()}</td>
                <td>{c.outcome}</td>
            </tr>
        );
    }
}