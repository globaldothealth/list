import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Button from '@mui/material/Button';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';

import { StyledDownloadButton } from './styled';
import { URLToSearchQuery } from '../util/searchQuery';
import axios from 'axios';

export function DownloadButton(): JSX.Element {
    const location = useLocation();
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileFormat, setFileFormat] = useState('');
    const [showFullDatasetButton, setShowFullDatasetButton] = useState(true);
    const [downloadButtonDisabled, setDownloadButtonDisable] = useState(true);

    const downloadDataSet = async (dataSet: string, formatType?: string) => {
        setIsLoading(true);

        const searchQuery: string = URLToSearchQuery(location.search);
        switch (dataSet) {
            case 'fullDataset':
                try {
                    const response = await axios({
                        method: 'post',
                        url: '/api/cases/getDownloadLink',
                        data: { format: 'csv' },
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    window.location.href = response.data.signedUrl;
                } catch (err) {
                    alert(
                        `There was an error while downloading data, please try again later. ${err}`,
                    );
                }
                break;

            case 'partialDataset':
                try {
                    const response = await axios({
                        method: 'post',
                        url: '/api/cases/downloadAsync',
                        data: {
                            format: formatType,
                            query: decodeURIComponent(searchQuery),
                        },
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    // Check for S3 signed URL
                    if (response.data.signedUrl !== undefined) {
                        window.location.href = response.data.signedUrl;
                    } else {
                        const filename = response.headers['content-disposition']
                            .split('filename=')[1]
                            .replace(/["]/g, '');
                        let downloadUrl;
                        if (
                            response.headers['content-type'] ===
                            'application/json'
                        ) {
                            downloadUrl =
                                'data:text/json;charset=utf-8,' +
                                encodeURIComponent(
                                    JSON.stringify(response.data),
                                );
                        } else {
                            downloadUrl = window.URL.createObjectURL(
                                new Blob([response.data]),
                            );
                        }
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.setAttribute('download', filename);
                        document.body.appendChild(link);
                        link.click();
                    }
                } catch (err) {
                    alert(
                        `There was an error while downloading data, please try again later. ${err}`,
                    );
                }
                break;
        }

        setIsLoading(false);
        setIsDownloadModalOpen(false);
    };

    const disabledButtonTooltipText = downloadButtonDisabled
        ? 'Please first select the file format you want to download'
        : '';

    useEffect(() => {
        if (location.search !== '') {
            setShowFullDatasetButton(false);
        } else {
            setShowFullDatasetButton(true);
        }
    }, [location.search]);

    const handleFileFormatChange = (event: SelectChangeEvent) => {
        if (
            event.target.value === 'csv' ||
            event.target.value === 'tsv' ||
            event.target.value === 'json'
        ) {
            setDownloadButtonDisable(false);
        } else {
            setDownloadButtonDisable(true);
        }

        setFileFormat(event.target.value as string);
    };

    return (
        <>
            <Button
                variant="outlined"
                color="primary"
                onClick={(): void => setIsDownloadModalOpen(true)}
                startIcon={<SaveAltIcon />}
                sx={{ whiteSpace: 'nowrap', minWidth: '240px' }}
            >
                Download dataset
            </Button>
            <Dialog
                open={isDownloadModalOpen}
                onClose={(): void => setIsDownloadModalOpen(false)}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
                fullWidth
            >
                <DialogTitle>Download dataset</DialogTitle>

                {!showFullDatasetButton && (
                    <FormControl
                        sx={{ maxWidth: '50%', margin: '8px 8px 8px 24px' }}
                    >
                        <InputLabel
                            shrink
                            id="demo-simple-select-placeholder-label-label"
                        ></InputLabel>
                        <Select
                            labelId="demo-simple-select-placeholder-label-label"
                            id="demo-simple-select-placeholder-label"
                            value={fileFormat}
                            onChange={handleFileFormatChange}
                            displayEmpty
                            sx={{
                                '& .MuiInput-input': {
                                    paddingLeft: '20px',
                                },
                            }}
                        >
                            <MenuItem value="">
                                <em>Data format</em>
                            </MenuItem>
                            <MenuItem value="csv">csv</MenuItem>
                            <MenuItem value="tsv">tsv</MenuItem>
                            <MenuItem value="json">json</MenuItem>
                        </Select>
                        <FormHelperText>
                            Please choose the file export format
                        </FormHelperText>
                    </FormControl>
                )}

                <DialogContent>
                    {showFullDatasetButton && (
                        <Typography variant="body2">
                            This download link provides access to the full
                            Global.health line list dataset, cached daily at
                            12:00am UTC. Any cases added past that time will not
                            be in the current download, but will be available
                            the next day.
                        </Typography>
                    )}

                    {isLoading && <LinearProgress sx={{ marginTop: '16px' }} />}
                    {showFullDatasetButton && (
                        <StyledDownloadButton
                            variant="contained"
                            color="primary"
                            onClick={() => downloadDataSet('fullDataset')}
                            disabled={isLoading}
                        >
                            Download Full Dataset
                        </StyledDownloadButton>
                    )}
                    {!showFullDatasetButton && (
                        <Tooltip
                            title={disabledButtonTooltipText}
                            placement="top"
                        >
                            <span>
                                <StyledDownloadButton
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        downloadDataSet(
                                            'partialDataset',
                                            fileFormat,
                                        );
                                        setIsDownloadModalOpen(false);
                                        alert(
                                            'Downloading now. Depending on the size of the data set, this could take some time.',
                                        );
                                    }}
                                    disabled={
                                        isLoading || downloadButtonDisabled
                                    }
                                >
                                    Download Filtered Dataset
                                </StyledDownloadButton>
                            </span>
                        </Tooltip>
                    )}
                    <Typography variant="body2">
                        <a
                            href="https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/citation.txt"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Citation guidelines
                        </a>
                    </Typography>

                    <Typography variant="body2">
                        <a
                            href="https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Data dictionary
                        </a>
                    </Typography>
                </DialogContent>
            </Dialog>
        </>
    );
}
