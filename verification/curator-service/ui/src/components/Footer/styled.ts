import { Theme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

export const useStyles = makeStyles((theme: Theme) => ({
    root: {
        padding: '24px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 0,
        width: '100%',
        transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    contentShift: {
        marginLeft: 240,
        width: 'calc(100% - 240px)',
        transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    socialMediaContainer: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '10px',
    },
    socialMediaButton: {
        width: '48px',
        height: '48px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: '50%',
        marginRight: '10px',
        cursor: 'pointer',
        transition: 'background-color .2s ease-in-out',

        '& .icon': {
            maxWidth: '12px',
            color: theme.palette.primary.main,
            transition: 'color .2s ease-in-out',
        },

        '&:hover': {
            backgroundColor: theme.palette.primary.main,

            '& .icon': {
                color: '#fff',
            },
        },
    },
    link: {
        fontWeight: 400,
        fontSize: '14px',
        margin: '0 20px',
    },
}));
