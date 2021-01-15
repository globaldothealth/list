import { Theme, createStyles } from '@material-ui/core/styles';

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { withStyles } from '@material-ui/core';

const styles = (theme: Theme) =>
    createStyles({
        container: {
            alignItems: 'center',
            display: 'flex',
            padding: '1em 0',
        },
        title: { marginRight: '1em' },
        tooltip: { background: theme.palette.background.paper },
    });

const AppTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        backgroundColor: theme.custom.palette.tooltip.backgroundColor,
        boxShadow: theme.shadows[1],
        color: theme.custom.palette.tooltip.textColor,
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
