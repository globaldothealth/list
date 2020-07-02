import { Theme, makeStyles } from '@material-ui/core/styles';

import React from 'react';
import User from './User';

const styles = makeStyles((theme: Theme) => ({
    root: {
        textAlign: 'center',
    },
    login: {
        marginTop: theme.spacing(10),
    },
    name: {
        marginTop: theme.spacing(10),
    },
    email: {
        marginTop: theme.spacing(2),
    },
    roles: {
        marginTop: theme.spacing(2),
    },
}));

export default function Profile(props: { user: User }): JSX.Element {
    const classes = styles();
    return (
        <div className={classes.root}>
            {!props.user.email && (
                <div className={classes.login}>
                    Login required to view this page
                </div>
            )}

            {props.user.name && (
                <div className={classes.name}>{props.user.name}</div>
            )}

            {props.user.email && (
                <div className={classes.email}>{props.user.email}</div>
            )}

            {props.user.roles && (
                <div className={classes.roles}>
                    {props.user.roles.join(', ')}
                </div>
            )}
        </div>
    );
}
