import { withStyles } from '@material-ui/core';
import { Theme, createStyles } from '@material-ui/core/styles';

import React from 'react';
import { WithStyles } from '@material-ui/core/styles/withStyles';

const styles = (theme: Theme) =>
    createStyles({
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
    });

interface User {
    name: string;
    email: string;
}

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> {
    user: User;
}

class Profile extends React.Component<Props, {}> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                {!this.props.user.email && (
                    <div className={classes.login}>
                        Login required to view this page
                    </div>)}

                {this.props.user.name && (
                    <div className={classes.name}>
                        {this.props.user.name}
                    </div>)}

                {this.props.user.email && (
                    <div className={classes.email}>
                        {this.props.user.email}
                    </div>)}
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(Profile);
