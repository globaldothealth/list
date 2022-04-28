import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/Chip';

interface ChipInputProps {
    values: string[];
    setValues?: (values: string[]) => void;
}

const ChipInput = ({ values, setValues }: ChipInputProps) => {
    return (
        <Autocomplete
            multiple
            options={[]}
            defaultValue={[]}
            onChange={(e, value) => console.log(value)}
            renderTags={(
                value: any[],
                getTagProps: (arg0: { index: any }) => JSX.IntrinsicAttributes,
            ) =>
                value.map((option: any, index: any) => {
                    return (
                        <Chip
                            key={index}
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                        />
                    );
                })
            }
            renderInput={(params: any) => (
                <TextField
                    {...params}
                    label="Receivers"
                    placeholder="Add a receiver by pressing enter after its dotName or address"
                />
            )}
        />
    );
};

export default ChipInput;
