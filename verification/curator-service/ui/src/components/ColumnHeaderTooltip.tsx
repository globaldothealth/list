import { Tooltip } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import { makeStyles } from '@material-ui/core';

const helpIconStyle = makeStyles(() => ({
    addMarginLeft: {
        marginLeft: '10px',
    },
}));

export default function ColumnHeaderTooltip(props: any): JSX.Element {
    const classes = helpIconStyle();
    const { tooltip } = props;
    return (
        <Tooltip
            title={tooltip}
            color="primary"
            interactive
            placement="top"
            arrow
        >
            <HelpIcon fontSize="small" className={classes.addMarginLeft} />
        </Tooltip>
    );
}
