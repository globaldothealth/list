import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core';
import { Theme } from '@material-ui/core/styles';

export const AppTooltip = withStyles((theme: Theme) => ({
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

        maxWidth: (props: Widetooltip) => props.maxwidth,
    },
}))(Tooltip);

interface Widetooltip {
    maxwidth: 'auto' | '40vw';
}
