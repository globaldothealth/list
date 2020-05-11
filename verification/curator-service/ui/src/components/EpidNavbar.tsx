import { Button, withStyles } from "@material-ui/core";
import { Theme, createStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import HomeIcon from '@material-ui/icons/Home';
import IconButton from '@material-ui/core/IconButton';
import { Link } from "react-router-dom";
import React from "react";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { WithStyles } from "@material-ui/core/styles/withStyles";
import axios from 'axios';

const styles = (theme: Theme) => createStyles({
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
    email: string;
}

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> { }

class EpidNavbar extends React.Component<Props, User> {
    constructor(props: any) {
        super(props);
        this.state = {
            email: "",
        };
    }

    componentDidMount() {
        axios.get<User>('/auth/profile')
            .then((resp) => {
                this.setState({ email: resp.data.email });
            }).catch((e) => {
                this.setState({ email: "" });
                console.error(e);
            });
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root} >
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
                        {this.state.email ?
                            <Button variant="contained" color="primary" href="/auth/logout">
                                Logout {this.state.email}
                            </Button> :
                            <Button variant="contained" color="secondary" href={process.env.REACT_APP_LOGIN_URL}>
                                Login
                            </Button>}
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}


export default withStyles(styles, { withTheme: true })(EpidNavbar);