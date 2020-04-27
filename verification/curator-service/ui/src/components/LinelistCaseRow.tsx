import React from "react";
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

interface RowProps {
    background: string
    case: Case
}

export interface Case {
    _id: string;
    outcome: string;
    date: Date;
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
                <TableCell>{new Date(c.date).toDateString()}</TableCell>
                <TableCell>{c.outcome}</TableCell>
            </TableRow >
        );
    }
}