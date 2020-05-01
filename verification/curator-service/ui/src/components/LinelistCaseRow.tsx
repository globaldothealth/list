import React from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import displayDate from "../util/display-date";

interface RowProps {
    background: string
    case: Case
}

interface Event {
    name: string;
    date: {
        range: {
            start: string;
            end: string;
        };
    };
}

export interface Case {
    _id: string;
    events: Event[];
    outcome : string;
}

export default class LinelistCaseRow extends React.Component<RowProps, {}> {

    render() {
        const c = this.props.case;
        const bg = this.props.background;
        const confirmedEvent = c.events.filter((e) => e.name === 'confirmed')[0];
        const confirmedStartDate = confirmedEvent.date.range.start;
        return (
            <TableRow key={c._id} style={{ background: bg }}>
                <TableCell component="th" scope="row">
                    {c._id}
                </TableCell>
                <TableCell>{confirmedStartDate ? displayDate(new Date(confirmedStartDate)) : ''}</TableCell>
                <TableCell>{c.outcome}</TableCell>
            </TableRow >
        );
    }
}