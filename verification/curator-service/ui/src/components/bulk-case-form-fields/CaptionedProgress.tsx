import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';

import Box from '@mui/material/Box';
import React from 'react';
import Typography from '@mui/material/Typography';

export default function FileUploadProgress(
    props: CircularProgressProps & { value: number },
): JSX.Element {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress {...props} />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography
                    variant="caption"
                    component="div"
                    color="textSecondary"
                >{`${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
}
