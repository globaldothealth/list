import {
    AppBar,
    IconButton,
    Modal,
    Toolbar,
    Typography,
    Box,
} from '@mui/material';
import React, { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';

const ModalContent = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    left: '15%',
    height: '100%',
    position: 'absolute',
    outline: 'none',
    // Remainder of the screen width accounting for left shift
    width: 'calc(100vw - 15%)',
}));

interface Props {
    children: ReactNode;
    title: string;
    onModalClose?: () => void;
}

class AppModal extends React.Component<Props, Record<string, unknown>> {
    render(): JSX.Element {
        return (
            <>
                <Modal open={true}>
                    <ModalContent>
                        <AppBar elevation={0} position="relative">
                            <Toolbar>
                                <IconButton
                                    sx={{ color: 'black' }}
                                    aria-label="close overlay"
                                    onClick={this.props.onModalClose}
                                    edge="start"
                                    size="large"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography
                                    sx={{ color: 'black' }}
                                    variant="h6"
                                    noWrap
                                >
                                    {this.props.title}
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        {/* scroll-container id needed for scrolling in CaseForm */}
                        <Box
                            id="scroll-container"
                            sx={{
                                height: 'calc(100% - 64px)',
                                overflow: 'auto',
                                padding: '1em',
                            }}
                        >
                            {this.props.children}
                        </Box>
                    </ModalContent>
                </Modal>
            </>
        );
    }
}

export default AppModal;
