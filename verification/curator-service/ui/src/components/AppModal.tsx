import {
    AppBar,
    IconButton,
    Modal,
    Toolbar,
    Typography,
} from '@material-ui/core';
import React, { ReactNode } from 'react';
import { Theme, createStyles } from '@material-ui/core/styles';

import CloseIcon from '@material-ui/icons/Close';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { withStyles } from '@material-ui/core';

const styles = (theme: Theme) =>
    createStyles({
        modalContents: {
            backgroundColor: theme.palette.background.paper,
            left: '15%',
            height: '100%',
            position: 'absolute',
            outline: 'none',
            // Remainder of the screen width accounting for left shift
            width: 'calc(100vw - 15%)',
        },
        container: {
            height: 'calc(100% - 80px)',
            overflow: 'auto',
            padding: '1em',
        },
    });

interface Props extends WithStyles<typeof styles> {
    children: ReactNode;
    title: string;
    onModalClose?: () => void;
}

class AppModal extends React.Component<Props, {}> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <>
                <Modal open={true}>
                    <div className={classes.modalContents}>
                        <AppBar position="relative">
                            <Toolbar>
                                <IconButton
                                    color="inherit"
                                    aria-label="close overlay"
                                    onClick={this.props.onModalClose}
                                    edge="start"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography variant="h6" noWrap>
                                    {this.props.title}
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        {/* scroll-container id needed for scrolling in CaseForm */}
                        <div
                            className={classes.container}
                            id="scroll-container"
                        >
                            {this.props.children}
                        </div>
                    </div>
                </Modal>
            </>
        );
    }
}

export default withStyles(styles)(AppModal);
