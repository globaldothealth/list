import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { ReactComponent as VerificationHeaderSvg } from './assets/verification_header.svg';

export default function VerificationStatusHeader(): JSX.Element {
    return (
        <Tooltip title="Verification status: Verified, Unverified or Excluded">
            <IconButton>
                <VerificationHeaderSvg />
            </IconButton>
        </Tooltip>
    );
}
