import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectDiseaseName } from '../../redux/app/selectors';
import { setSort } from '../../redux/linelistTable/slice';
import { selectSort } from '../../redux/linelistTable/selectors';
import { SortBy, SortByOrder } from '../../constants/types';

import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const sortKeywords = [
    {
        name: 'Confirmation date ascending',
        value: SortBy.ConfirmationDate,
        order: SortByOrder.Ascending,
    },
    {
        name: 'Confirmation date descending',
        value: SortBy.ConfirmationDate,
        order: SortByOrder.Descending,
    },
];

const Header = () => {
    const dispatch = useAppDispatch();

    const diseaseName = useAppSelector(selectDiseaseName);
    const sort = useAppSelector(selectSort);

    const parseSelectValues = (value: SortBy, order: SortByOrder) => {
        return `${value}|${order}`;
    };

    const handleChange = (event: SelectChangeEvent) => {
        const value = event.target.value as string;
        if (!value) return;

        const chosenSortByValue = value.split('|')[0];
        const chosenSortByOrder = value.split('|')[1];
        dispatch(
            setSort({
                value: chosenSortByValue as SortBy,
                order: chosenSortByOrder as SortByOrder,
            }),
        );
    };

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ margin: '1rem 0' }}
        >
            <Typography variant="body1">{diseaseName} Linelist</Typography>

            <FormControl sx={{ minWidth: 200 }} variant="standard" size="small">
                <InputLabel id="sort-by-select-label">Sort by</InputLabel>
                <Select
                    labelId="sort-by-select-label"
                    id="sort-by-select"
                    label="Sort by"
                    value={parseSelectValues(sort.value, sort.order)}
                    onChange={handleChange}
                >
                    {sortKeywords.map((keyword) => (
                        <MenuItem
                            value={parseSelectValues(
                                keyword.value,
                                keyword.order,
                            )}
                            key={keyword.order}
                            data-testid="sortby-option"
                        >
                            {keyword.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Stack>
    );
};

export default Header;
