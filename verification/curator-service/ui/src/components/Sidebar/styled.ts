import { makeStyles, Theme } from '@material-ui/core/styles';
import { drawerWidth } from '../App';

export const useStyles = makeStyles((theme: Theme) => ({
    link: {
        marginTop: 12,
    },
    divider: {
        backgroundColor: '#0A7369',
        height: '1px',
        opacity: '0.2',
        margin: '24px 0',
        marginTop: '12px',
        width: '100%',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        backgroundColor: '#ECF3F0',
        border: 'none',
        width: drawerWidth,
    },
    drawerContents: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        marginLeft: '24px',
        marginRight: '32px',
    },
    drawerHeader: {
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
    },
    createNewButton: {
        margin: '12px 0',
        width: '100%',
    },
    createNewIcon: {
        marginRight: '12px',
    },
    covidTitle: {
        fontSize: '28px',
        marginLeft: '14px',
        marginTop: '8px',
    },
    spacer: {
        flexGrow: 1,
    },
    lastLink: {
        marginBottom: 24,
    },
}));