import React from 'react';
import { Tooltip } from '@material-ui/core';
import { ReactComponent as UnverifiedIcon } from './assets/unverified_icon.svg';
import { VerificationStatus } from './Case';
import { ReactComponent as VerifiedIcon } from './assets/verified_icon.svg';

interface Props {
    status?: VerificationStatus;
}

export default function VerificationStatusIndicator(props: Props): JSX.Element {
    let helpText;
    let iconElement;
    if (props.status === VerificationStatus.Verified) {
        helpText = 'Verified';
        iconElement = <VerifiedIcon data-testid="verified-svg" />;
    } else {
        helpText = 'Pending verification';
        iconElement = <UnverifiedIcon data-testid="unverified-svg" />;
    }
    return (
        <Tooltip title={helpText} placement="right">
            {iconElement}
        </Tooltip>
    );
}
