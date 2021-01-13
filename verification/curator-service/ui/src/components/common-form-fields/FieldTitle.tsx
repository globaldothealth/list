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
    });

const AppTooltip = withStyles((theme: Theme) => ({
    arrow: {
        color: theme.palette.primary.main,
    },
    tooltip: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        boxShadow: theme.shadows[1],
        fontSize: 16,
        fontWeight: 'normal',
        padding: '1rem',
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
                    arrow
                    interactive={props.interactive}
                    title={props.tooltip}
                >
                    <HelpOutlineIcon fontSize="small" />
                </AppTooltip>
            )}
        </div>
    );
}

export default withStyles(styles)(FieldTitle);
