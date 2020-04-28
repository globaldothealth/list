import React from "react";
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import displayDate from "../util/display-date";

interface RowProps {
    background: string
    case: Case
}

export interface Case {
    _id: string;
    outcome: string;
    eventSequence: {
        confirmed: Date;
    };
}

export default class LinelistCaseRow extends React.Component<RowProps, {}> {

    render() {
        const c = this.props.case;
        const bg = this.props.background;
        return (
            <TableRow key={c._id} style={{ background: bg }}>
                <TableCell component="th" scope="row">
                    {c._id}
                </TableCell>
                <TableCell>{c.eventSequence ? displayDate(new Date(c.eventSequence.confirmed)) : ''}</TableCell>
                <TableCell>{c.outcome}</TableCell>
            </TableRow >
        );
    }
}