import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useFormik } from 'formik';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { filtersToURL, URLToFilters } from '../util/searchQuery';

import {
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    OutlinedInput,
    IconButton,
    // InputAdornment,
    // IconButton,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
// import { HelpOutline } from '@material-ui/icons';
// import { AppTooltip } from './common-form-fields/AppTooltip';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCountries } from '../../redux/filters/thunk';
import {
    countryList,
    isLoading,
    filterError,
} from '../../redux/filters/selectors';
import { codeForCountry } from '../util/countryNames';
import CloseIcon from '@material-ui/icons/Close';
import { useStyles } from './styled';

interface FiltersModalProps {
    isOpen: boolean;
    activeFilterInput: string;
    handleClose: () => void;
    setActiveFilterInput: (value: string) => void;
    showModalAlert: boolean;
    closeAlert: (flag: boolean) => void;
}

export interface FilterFormValues {
    country?: string;
    gender?: '' | 'Male' | 'Female' | 'Not provided';
    verificationstatus?: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    nationality?: string;
    occupation?: string;
    outcome?: string;
    variant?: string;
    dateconfirmedafter?: string;
    dateconfirmedbefore?: string;
    curatoremail?: string;
    caseid?: string;
    sourceid?: string;
    sourceurl?: string;
    uploadid?: string;
}

interface FilterFormErrors {
    dateconfirmedbefore?: string | null;
    dateconfirmedafter?: string | null;
}

export default function FiltersDialog({
    isOpen,
    activeFilterInput,
    handleClose,
    setActiveFilterInput,
    showModalAlert,
    closeAlert,
}: FiltersModalProps): JSX.Element {
    const classes = useStyles();
    const location = useLocation();
    const history = useHistory();

    const [formValues, setFormValues] = useState<FilterFormValues>(
        URLToFilters(location.search),
    );

    // Check screen size
    const isSmallScreen = useMediaQuery('(max-height:800px)');
    const inputSize = isSmallScreen ? 'small' : 'medium';

    const dispatch = useAppDispatch();
    const loadingState = useAppSelector(isLoading);
    const error = useAppSelector(filterError);

    useEffect(() => {
        dispatch(fetchCountries());
    }, [dispatch]);

    const countries = useAppSelector(countryList);

    useEffect(() => {
        const newFilters = URLToFilters(location.search);
        if (!newFilters) return;

        setFormValues(newFilters);
    }, [location.search]);

    const validateForm = (values: FilterFormValues) => {
        const errors: FilterFormErrors = {};

        if (
            values.dateconfirmedbefore &&
            new Date(values.dateconfirmedbefore) > new Date()
        ) {
            errors.dateconfirmedbefore =
                "Date confirmed before can't be a future date";
        }

        if (
            values.dateconfirmedafter &&
            new Date(values.dateconfirmedafter) > new Date()
        ) {
            errors.dateconfirmedafter =
                "Date confirmed after can't be a future date";
        }

        return errors;
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: formValues,
        validate: validateForm,
        validateOnChange: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSubmit: (values: any) => {
            Object.keys(values).map(
                (k) =>
                    (values[k] =
                        typeof values[k] == 'string'
                            ? values[k].trim()
                            : values[k]),
            );
            handleSetModalAlert();
            handleClose();
            const searchQuery = filtersToURL(values);
            history.push({ pathname: '/cases', search: searchQuery });
        },
    });

    // Reset focus on change
    useEffect(() => {
        if (activeFilterInput === '') return;

        setActiveFilterInput('');

        // eslint-disable-next-line
    }, [formik.values]);

    const handleClearFiltersClick = () => {
        setFormValues({});
        formik.resetForm();
        // commented in case we want in future the button to reset the filters already applied
        // history.push({ pathname: '/cases', search: '' });
    };

    function handleSetModalAlert() {
        closeAlert(false);
    }

    const closeAndResetAlert = () => {
        handleClose();
        closeAlert(false);
    };

    // COMMENTED OUT AS WE MAY WANT TO ADD TOOLTIPS TO SOME FIELDS IN THE FUTURE
    // const tooltipHelpIcon = (tooltipContent: JSX.Element) => {
    //     return (
    //         <InputAdornment position="end">
    //             <AppTooltip maxwidth="auto" arrow title={tooltipContent}>
    //                 <IconButton edge="end">
    //                     <HelpOutline className={classes.helpIcon} />
    //                 </IconButton>
    //             </AppTooltip>
    //         </InputAdornment>
    //     );
    // };

    // const admin1Tooltip = (
    //     <>
    //         <strong>Location admin 1</strong>
    //         <p>
    //             Aliqua esse officia nostrud veniam id ut nostrud in
    //             reprehenderit ea reprehenderit excepteur cillum.
    //         </p>
    //     </>
    // );

    // const admin2Tooltip = (
    //     <>
    //         <strong>Location admin 2</strong>
    //         <p>
    //             Aliqua esse officia nostrud veniam id ut nostrud in
    //             reprehenderit ea reprehenderit excepteur cillum.
    //         </p>
    //     </>
    // );

    // const admin3Tooltip = (
    //     <>
    //         <strong>Location admin 3</strong>
    //         <p>
    //             Aliqua esse officia nostrud veniam id ut nostrud in
    //             reprehenderit ea reprehenderit excepteur cillum.
    //         </p>
    //     </>
    // );

    return (
        <Dialog open={isOpen} maxWidth={'xl'} onClose={closeAndResetAlert}>
            <DialogTitle>
                Apply filters
                <IconButton
                    aria-label="close"
                    className={classes.closeButton}
                    onClick={handleClose}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            {showModalAlert && (
                <Alert
                    severity="info"
                    onClose={() => {
                        handleSetModalAlert();
                    }}
                    className={classes.alertBox}
                >
                    Please do not use filters in the Search Bar, use them here
                    instead.
                </Alert>
            )}
            <DialogContent className={classes.dialogContent}>
                <form className={classes.root} onSubmit={formik.handleSubmit}>
                    {/* GENERAL */}
                    <div>
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="country-label">Country</InputLabel>
                            {!error && (
                                <Select
                                    autoFocus={activeFilterInput === 'country'}
                                    labelId="country-label"
                                    id="country"
                                    name="country"
                                    label="Country"
                                    value={formik.values.country || ''}
                                    onChange={formik.handleChange}
                                    disabled={loadingState}
                                    data-testid="country-select"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {countries.map((country: string) => (
                                        <MenuItem
                                            value={codeForCountry(country)}
                                            key={codeForCountry(country)}
                                        >
                                            {country}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        </FormControl>
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="gender-label">Gender</InputLabel>
                            <Select
                                autoFocus={activeFilterInput === 'gender'}
                                labelId="gender-label"
                                id="gender"
                                name="gender"
                                label="Gender"
                                value={formik.values.gender || ''}
                                onChange={formik.handleChange}
                            >
                                <MenuItem value="">None</MenuItem>
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="notProvided">
                                    Not provided
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="verification-label">
                                Verification status
                            </InputLabel>
                            <Select
                                autoFocus={
                                    activeFilterInput === 'verificationstatus'
                                }
                                labelId="varification-label"
                                id="verificationStatus"
                                name="verificationstatus"
                                label="Verification Status"
                                value={formik.values.verificationstatus || ''}
                                onChange={formik.handleChange}
                            >
                                <MenuItem value="">None</MenuItem>
                                <MenuItem value="unverified">
                                    Unverified
                                </MenuItem>
                                <MenuItem value="verified">Verified</MenuItem>
                                <MenuItem value="excluded">Excluded</MenuItem>
                            </Select>
                        </FormControl>
                    </div>

                    {/* LOCATION ADMIN */}
                    <div>
                        <FormControl
                            variant="outlined"
                            className={classes.textField}
                            size={inputSize}
                        >
                            <InputLabel htmlFor="admin1">
                                Location admin 1
                            </InputLabel>
                            <OutlinedInput
                                autoFocus={activeFilterInput === 'admin1'}
                                id="admin1"
                                type="text"
                                label="Location admin 1"
                                name="admin1"
                                value={formik.values.admin1 || ''}
                                onChange={formik.handleChange}
                                // endAdornment={tooltipHelpIcon(admin1Tooltip)}
                            />
                        </FormControl>
                        <FormControl
                            variant="outlined"
                            className={classes.textField}
                            size={inputSize}
                        >
                            <InputLabel htmlFor="admin2">
                                Location admin 2
                            </InputLabel>
                            <OutlinedInput
                                autoFocus={activeFilterInput === 'admin2'}
                                id="admin2"
                                type="text"
                                label="Location admin 2"
                                name="admin2"
                                value={formik.values.admin2 || ''}
                                onChange={formik.handleChange}
                                // endAdornment={tooltipHelpIcon(admin2Tooltip)}
                            />
                        </FormControl>
                        <FormControl
                            variant="outlined"
                            className={classes.textField}
                            size={inputSize}
                        >
                            <InputLabel htmlFor="admin3">
                                Location admin 3
                            </InputLabel>
                            <OutlinedInput
                                autoFocus={activeFilterInput === 'admin3'}
                                id="admin3"
                                type="text"
                                label="Location admin 3"
                                name="admin3"
                                value={formik.values.admin3 || ''}
                                onChange={formik.handleChange}
                                // endAdornment={tooltipHelpIcon(admin3Tooltip)}
                            />
                        </FormControl>
                    </div>

                    <div className={classes.divider} />

                    <div>
                        <TextField
                            autoFocus={activeFilterInput === 'nationality'}
                            id="nationality"
                            label="Nationality"
                            name="nationality"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.nationality || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.nationality &&
                                Boolean(formik.errors.nationality)
                            }
                            helperText={
                                formik.touched.nationality &&
                                formik.errors.nationality
                            }
                        />
                        <TextField
                            autoFocus={activeFilterInput === 'occupation'}
                            id="occupation"
                            label="Occupation"
                            name="occupation"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.occupation || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.occupation &&
                                Boolean(formik.errors.occupation)
                            }
                            helperText={
                                formik.touched.occupation &&
                                formik.errors.occupation
                            }
                        />
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="outcome-label">Outcome</InputLabel>
                            {!error && (
                                <Select
                                    autoFocus={activeFilterInput === 'outcome'}
                                    labelId="outcome-label"
                                    id="outcome"
                                    name="outcome"
                                    label="Outcome"
                                    value={formik.values.outcome || ''}
                                    onChange={formik.handleChange}
                                    disabled={loadingState}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="Recovered">
                                        Recovered
                                    </MenuItem>
                                    <MenuItem value="Death">Death</MenuItem>
                                </Select>
                            )}
                        </FormControl>
                    </div>

                    <div>
                        <TextField
                            autoFocus={activeFilterInput === 'variant'}
                            id="variant"
                            label="Variant of concern"
                            name="variant"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.variant || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.variant &&
                                Boolean(formik.errors.variant)
                            }
                            helperText={
                                formik.touched.variant && formik.errors.variant
                            }
                        />
                        <TextField
                            autoFocus={
                                activeFilterInput === 'dateconfirmedbefore'
                            }
                            id="dateconfirmedbefore"
                            label="Date confirmed before"
                            name="dateconfirmedbefore"
                            type="date"
                            variant="outlined"
                            size={inputSize}
                            InputLabelProps={{ shrink: true }}
                            value={formik.values.dateconfirmedbefore || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.dateconfirmedbefore &&
                                Boolean(formik.errors.dateconfirmedbefore)
                            }
                            helperText={
                                formik.touched.dateconfirmedbefore &&
                                formik.errors.dateconfirmedbefore
                            }
                        />
                        <TextField
                            autoFocus={
                                activeFilterInput === 'dateconfirmedafter'
                            }
                            id="dateconfirmedafter"
                            label="Date confirmed after"
                            name="dateconfirmedafter"
                            type="date"
                            variant="outlined"
                            size={inputSize}
                            InputLabelProps={{ shrink: true }}
                            value={formik.values.dateconfirmedafter || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.dateconfirmedafter &&
                                Boolean(formik.errors.dateconfirmedafter)
                            }
                            helperText={
                                formik.touched.dateconfirmedafter &&
                                formik.errors.dateconfirmedafter
                            }
                        />
                    </div>

                    <div className={classes.divider} />

                    <div>
                        <TextField
                            autoFocus={activeFilterInput === 'curatoremail'}
                            id="curatoremail"
                            label="Curator email"
                            name="curatoremail"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.curatoremail || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.curatoremail &&
                                Boolean(formik.errors.curatoremail)
                            }
                            helperText={
                                formik.touched.curatoremail &&
                                formik.errors.curatoremail
                            }
                        />
                        <TextField
                            autoFocus={activeFilterInput === 'caseid'}
                            id="caseid"
                            label="Case ID"
                            name="caseid"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.caseid || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.caseid &&
                                Boolean(formik.errors.caseid)
                            }
                            helperText={
                                formik.touched.caseid && formik.errors.caseid
                            }
                        />
                        <TextField
                            autoFocus={activeFilterInput === 'sourceurl'}
                            id="sourceurl"
                            label="Source URL"
                            name="sourceurl"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.sourceurl || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.sourceurl &&
                                Boolean(formik.errors.sourceurl)
                            }
                            helperText={
                                formik.touched.sourceurl &&
                                formik.errors.sourceurl
                            }
                        />
                    </div>

                    <div>
                        <TextField
                            autoFocus={activeFilterInput === 'uploadid'}
                            id="uploadid"
                            label="Upload ID"
                            name="uploadid"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.uploadid || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.uploadid &&
                                Boolean(formik.errors.uploadid)
                            }
                            helperText={
                                formik.touched.uploadid &&
                                formik.errors.uploadid
                            }
                        />
                        <TextField
                            autoFocus={activeFilterInput === 'sourceid'}
                            id="sourceid"
                            label="Source ID"
                            name="sourceid"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.sourceid || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.sourceid &&
                                Boolean(formik.errors.sourceid)
                            }
                            helperText={
                                formik.touched.sourceid &&
                                formik.errors.sourceid
                            }
                        />
                    </div>

                    <div className={classes.searchBtnContainer}>
                        <Button
                            color="primary"
                            variant="outlined"
                            type="button"
                            size={inputSize}
                            onClick={handleClearFiltersClick}
                        >
                            Clear filters
                        </Button>

                        <Button
                            color="primary"
                            variant="contained"
                            type="submit"
                            data-test-id="search-by-filter-button"
                            name="filterButton"
                            id="start-filtering"
                            size={inputSize}
                            className={classes.searchBtn}
                        >
                            Apply
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}