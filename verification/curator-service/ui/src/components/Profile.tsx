import { Theme, makeStyles } from '@material-ui/core/styles';

import React from 'react';
import User from './User';
import { Chip, Tooltip } from '@material-ui/core';

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
    role: {
        marginTop: theme.spacing(2),
        marginRight: theme.spacing(1),
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
                <div className={classes.name}>
                    <strong>Name:</strong> {props.user.name}
                </div>
            )}

            {props.user.email && (
                <div className={classes.email}>
                    <strong>Email: </strong>
                    {props.user.email}
                </div>
            )}

            {props.user.roles &&
                props.user.roles.map((role) => {
                    const tooltip = (
                        text: string,
                        role: string,
                    ): JSX.Element => {
                        return (
                            <Tooltip
                                className={classes.role}
                                key={role}
                                title={text}
                            >
                                <Chip variant="outlined" label={role} />
                            </Tooltip>
                        );
                    };
                    switch (role) {
                        case 'reader':
                            return tooltip(
                                'readers can read the linelist data',
                                role,
                            );
                        case 'curator':
                            return tooltip(
                                'curators can submit and verify cases and ingestion sources',
                                role,
                            );
                        case 'admin':
                            return tooltip(
                                'admins can administer roles of other users',
                                role,
                            );
                        default:
                            throw Error(`Unknown role ${role}`);
                    }
                })}
        </div>
    );
}
