import Tooltip from '@mui/material/Tooltip';
import { Theme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';

interface Widetooltip {
    maxwidth: 'auto' | '40vw';
}

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
        '& button': {
            background: 'unset',
            border: 'none',
            fontWeight: 'bold',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0',
            borderBottom: '1px dotted white',
        },
    },
}))(Tooltip);
