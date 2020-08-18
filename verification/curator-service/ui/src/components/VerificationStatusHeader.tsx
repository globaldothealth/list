import { IconButton, Tooltip } from '@material-ui/core';

import React from 'react';
import { ReactComponent as VerificationHeaderSvg } from './assets/verification_header.svg';

export default function VerificationStatusHeader(): JSX.Element {
    return (
        <Tooltip title="Coming soon: toggle verification status">
            <IconButton>
                <VerificationHeaderSvg />
            </IconButton>
        </Tooltip>
    );
}
