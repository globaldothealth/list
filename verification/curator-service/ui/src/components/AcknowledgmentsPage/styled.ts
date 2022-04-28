import { Theme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';
import createStyles from '@mui/styles/createStyles';

export const useTableStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '80%',
            margin: '10em auto auto auto',
        },

        tableRow: {
            '&:nth-of-type(odd)': {
                backgroundColor: theme.palette.action.hover,
            },
        },
        headerRow: {
            backgroundColor: theme.palette.primary.main,
        },
        headerCell: {
            color: '#fff',
            fontWeight: 'bold',
        },
        activeCellLabel: {
            '&.MuiTableSortLabel-active': {
                color: '#fff',
            },
            '&.MuiTableSortLabel-root.MuiTableSortLabel-active.MuiTableSortLabel-root.MuiTableSortLabel-active .MuiTableSortLabel-icon':
                {
                    color: '#fff',
                },
            '&:hover': {
                color: '#fff',
                opacity: 0.8,
            },
        },
        pageTitle: { fontSize: '2em', marginBottom: '1em' },
        pageSubTitle: {
            fontSize: '1.4em',
            marginBottom: '1.6em',
            width: '70%',
        },
        divider: {
            width: '70%',
        },
        belowNote: {
            width: '70%',
            marginTop: '0.4em',
        },
        paper: {
            width: '100%',
            marginBottom: theme.spacing(2),
            position: 'relative',
        },
        table: {
            minWidth: 750,
        },
        visuallyHidden: {
            border: 0,
            clip: 'rect(0 0 0 0)',
            height: 1,
            margin: -1,
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            top: 20,
            width: 1,
        },
        loaderConrainer: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            zIndex: 1000,
        },
    }),
);
