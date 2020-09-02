import { Theme, createStyles } from '@material-ui/core/styles';

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { withStyles } from '@material-ui/core';

const styles = () =>
    createStyles({
        container: {
            alignItems: 'center',
            display: 'flex',
            padding: '1em 0',
        },
        title: { marginRight: '1em' },
        tooltip: { background: 'white' },
    });

const AppTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        backgroundColor: '#FEEFC3',
        boxShadow: theme.shadows[1],
        color: 'rgba(0, 0, 0, 0.87)',
        fontSize: 13,
        fontWeight: 'normal',
    },
}))(Tooltip);

interface FieldTitleProps extends WithStyles<typeof styles> {
    title: string;
    tooltip?: string | JSX.Element;
    interactive?: boolean;
}

function FieldTitle(props: FieldTitleProps): JSX.Element {
    const { classes } = props;
    return (
        <div className={classes.container}>
            <div className={classes.title}>
                {props.title.toLocaleUpperCase()}
            </div>
            {props.tooltip && (
                <AppTooltip
                    interactive={props.interactive}
                    title={props.tooltip}
                    className={classes.tooltip}
                >
                    <HelpOutlineIcon fontSize="small" />
                </AppTooltip>
            )}
        </div>
    );
}

export default withStyles(styles)(FieldTitle);
