import React, { useEffect } from "react";
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import HomeIcon from '@material-ui/icons/Home';
import IconButton from '@material-ui/core/IconButton';
import { Link } from "react-router-dom";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        menuButton: {
            marginRight: theme.spacing(2),
        },
        title: {
            flexGrow: 1,
        },
    }),
);

export default function EpidNavbar() {
    const classes = useStyles();

    useEffect(() => {
        // TODO: Fetch /api/profile and display user info in navbar.
    });

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Link to="/">
                        <IconButton
                            data-testid="home-btn"
                            edge="start"
                            className={classes.menuButton}
                            aria-label="menu">
                            <HomeIcon />
                        </IconButton>
                    </Link>
                    <Typography variant="h6" className={classes.title}>
                        epid
                    </Typography>
                </Toolbar>
            </AppBar>
        </div>
    );
}
