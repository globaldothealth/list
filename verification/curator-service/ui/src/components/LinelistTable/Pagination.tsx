import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import Box from '@mui/material/Box';

interface PaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement>,
        newPage: number,
    ) => void;
}

const Pagination = (props: PaginationProps) => {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === 'rtl' ? (
                    <LastPageIcon />
                ) : (
                    <FirstPageIcon />
                )}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === 'rtl' ? (
                    <KeyboardArrowRight />
                ) : (
                    <KeyboardArrowLeft />
                )}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === 'rtl' ? (
                    <KeyboardArrowLeft />
                ) : (
                    <KeyboardArrowRight />
                )}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === 'rtl' ? (
                    <FirstPageIcon />
                ) : (
                    <LastPageIcon />
                )}
            </IconButton>
        </Box>
    );
};

export default Pagination;
