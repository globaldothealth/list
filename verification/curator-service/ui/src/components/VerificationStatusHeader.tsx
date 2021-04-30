import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { ReactComponent as VerificationHeaderSvg } from './assets/verification_header.svg';

interface ColumnHeaderProps {
    onClickAction: (e: React.MouseEvent<HTMLDivElement>) => void;
}
const VerificationStatusHeader: React.FC<ColumnHeaderProps> = ({onClickAction}) => {
    return (
        <Tooltip title="Verification status: Verified, Unverified or Excluded" onClick={onClickAction}>
            <IconButton>
                <VerificationHeaderSvg />
            </IconButton>
        </Tooltip>
    );
}

export default VerificationStatusHeader;

