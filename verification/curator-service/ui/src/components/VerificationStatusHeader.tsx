import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ReactComponent as VerificationHeaderSvg } from './assets/verification_header.svg';

interface ColumnHeaderProps {
    onClickAction: (e: React.MouseEvent<HTMLDivElement>) => void;
}
const VerificationStatusHeader: React.FC<ColumnHeaderProps> = ({
    onClickAction,
}) => {
    return (
        <Tooltip
            title="Verification status: Verified, Unverified or Excluded"
            onClick={onClickAction}
        >
            <IconButton size="large">
                <VerificationHeaderSvg />
            </IconButton>
        </Tooltip>
    );
};

export default VerificationStatusHeader;
