import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { selectUser } from '../redux/auth/selectors';

import { Theme, makeStyles } from '@material-ui/core/styles';
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

export default function Profile(): JSX.Element {
    const classes = styles();

    const user = useAppSelector(selectUser);

    return (
        <>
            {user ? (
                <div className={classes.root}>
                    {!user.email && (
                        <div className={classes.login}>
                            Login required to view this page
                        </div>
                    )}

                    {user.name && (
                        <div className={classes.name}>
                            <strong>Name:</strong> {user.name}
                        </div>
                    )}

                    {user.email && (
                        <div className={classes.email}>
                            <strong>Email: </strong>
                            {user.email}
                        </div>
                    )}

                    {user.roles &&
                        user.roles.map((role) => {
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
            ) : (
                <></>
            )}
        </>
    );
}
