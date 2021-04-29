import React from 'react';
import { Tooltip } from '@material-ui/core';

import { ReactComponent as UnverifiedIcon } from './assets/unverified_icon.svg';
import { ReactComponent as VerifiedIcon } from './assets/verified_icon.svg';
import { ReactComponent as ExcludedIcon } from './assets/excluded_icon.svg';
import { VerificationStatus } from './Case';
import renderDate from './util/date';

interface Props {
    status?: VerificationStatus;
    exclusionData?: {
        date: string;
        note: string;
    };
}

export default function VerificationStatusIndicator(props: Props): JSX.Element {
    let helpText;
    let iconElement;
    if (props.status === VerificationStatus.Verified) {
        helpText = 'Verified';
        iconElement = <VerifiedIcon data-testid="verified-svg" />;
    } else if (props.status === VerificationStatus.Excluded) {
        if (props.exclusionData) {
            const { date, note } = props.exclusionData;
            helpText = `Excluded. Date: ${renderDate(date)}, Note: ${note}`;
        } else {
            helpText = 'Excluded';
        }

        iconElement = <ExcludedIcon data-testid="excluded-svg" />;
    } else {
        helpText = 'Unverified';
        iconElement = <UnverifiedIcon data-testid="unverified-svg" />;
    }

    return (
        <Tooltip title={helpText} placement="right">
            {iconElement}
        </Tooltip>
    );
}
