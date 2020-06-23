import React from 'react';
import { Typography } from '@material-ui/core';
import User from './User';

interface Props {
    user: User;
}
export default function Home(props: Props): JSX.Element {
    return props.user.email ? (
        <Typography variant="body1">
            Welcome to the Global Health Curator Portal
        </Typography>
    ) : (
        <Typography variant="body1">
            Please Login to access the Global Health Curator Portal
        </Typography>
    );
}
