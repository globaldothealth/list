import { Theme, createStyles } from '@material-ui/core/styles';

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { withStyles } from '@material-ui/core';
import { AppTooltip } from './AppTooltip';

const styles = (theme: Theme) =>
    createStyles({
        container: {
            alignItems: 'center',
            display: 'flex',
            padding: '1em 0',
        },
        title: { marginRight: '1em' },
    });

interface FieldTitleProps extends WithStyles<typeof styles> {
    title: string;
    tooltip?: string | JSX.Element;
    interactive?: boolean;
    widetooltip?: boolean;
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
                    title={props.tooltip || ''}
                    maxwidth={props.widetooltip ? '40vw' : 'auto'}
                >
                    <HelpOutlineIcon fontSize="small" />
                </AppTooltip>
            )}
        </div>
    );
}

export default withStyles(styles)(FieldTitle);
