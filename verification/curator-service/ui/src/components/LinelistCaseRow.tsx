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
    dateRange: {
        start: string;
        end: string;
    };
}

interface Demographics {
    sex: string;
}

export interface Case {
    _id: string;
    importedCase: {
        outcome: string;
    };
    events: Event[];
    demographics: Demographics;
}

export default class LinelistCaseRow extends React.Component<RowProps, {}> {

    render() {
        const c = this.props.case;
        const bg = this.props.background;
        const confirmedEvent = c.events.filter((e) => e.name === 'confirmed')[0];
        const confirmedStartDate = confirmedEvent.dateRange.start;
        return (
            <TableRow key={c._id} style={{ background: bg }}>
                <TableCell component="th" scope="row">
                    {c._id}
                </TableCell>
                <TableCell>{confirmedStartDate ? displayDate(new Date(confirmedStartDate)) : ''}</TableCell>
                <TableCell>{c.importedCase.outcome}</TableCell>
            </TableRow >
        );
    }
}