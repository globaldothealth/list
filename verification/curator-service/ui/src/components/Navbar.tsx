import { Button, withStyles } from '@material-ui/core';
import { Theme, createStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import HomeIcon from '@material-ui/icons/Home';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router-dom';
import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { WithStyles } from '@material-ui/core/styles/withStyles';

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
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
    });

interface User {
    name: string;
    email: string;
}

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> {
    user: User;
}

class Navbar extends React.Component<Props, {}> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <AppBar position="fixed">
                    <Toolbar>
                        <Link to="/">
                            <IconButton
                                data-testid="home-btn"
                                edge="start"
                                className={classes.menuButton}
                                aria-label="menu"
                            >
                                <HomeIcon />
                            </IconButton>
                        </Link>
                        <Typography variant="h6" className={classes.title}>
                            Global Health Curator Portal
                        </Typography>
                        {this.props.user.email ? (
                            <Button
                                variant="contained"
                                color="primary"
                                href="/auth/logout"
                            >
                                Logout {this.props.user.email}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="secondary"
                                href={process.env.REACT_APP_LOGIN_URL}
                            >
                                Login
                            </Button>
                        )}
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(Navbar);
