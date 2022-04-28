import { Theme } from '@mui/material/styles';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

export const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            '& .MuiTextField-root': {
                margin: theme.spacing(1),
                width: '25ch',

                '@media (max-height:800px)': {
                    width: '20ch',
                },
            },
        },
        dialogContent: {
            paddingBottom: '24px',
        },
        textField: {
            width: '25ch',
            margin: theme.spacing(1),

            '@media (max-height:800px)': {
                width: '20ch',
            },
        },
        formControl: {
            margin: theme.spacing(1),
            minWidth: '25ch',

            '@media (max-height:800px)': {
                minWidth: '20ch',
            },
        },
        searchBtnContainer: {
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '2rem',

            '@media (max-height:800px)': {
                marginTop: '1rem',
            },
        },
        searchBtn: {
            marginLeft: '0.5rem',
        },
        divider: {
            margin: '2rem auto',
            height: '1px',
            width: '90%',
            backgroundColor: '#ccc',

            '@media (max-height:800px)': {
                margin: '1rem auto',
            },
        },
        helpIcon: {
            color: '#ccc',
        },
        alertBox: {
            margin: '0 32px',
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: '#C4C4C4',
        },
    }),
);
