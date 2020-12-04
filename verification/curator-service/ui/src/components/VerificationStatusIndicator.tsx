import React from 'react';
import { Tooltip } from '@material-ui/core';

import { ReactComponent as UnverifiedIcon } from './assets/unverified_icon.svg';
import { ReactComponent as VerifiedIcon } from './assets/verified_icon.svg';
import { ReactComponent as ExcludedIcon } from './assets/excluded_icon.svg';
import { VerificationStatus } from './Case';

interface Props {
    status?: VerificationStatus;
}

export default function VerificationStatusIndicator(props: Props): JSX.Element {
    let helpText;
    let iconElement;
    if (props.status === VerificationStatus.Verified) {
        helpText = 'Verified';
        iconElement = <VerifiedIcon data-testid="verified-svg" />;
    } else if (props.status === VerificationStatus.Unverified) {
        helpText = 'Unverified';
        iconElement = <UnverifiedIcon data-testid="unverified-svg" />;
    } else {
        helpText = 'Excluded';
        iconElement = <ExcludedIcon data-testid="excluded-svg" />;
    }
    return (
        <Tooltip title={helpText} placement="right">
            {iconElement}
        </Tooltip>
    );
}
