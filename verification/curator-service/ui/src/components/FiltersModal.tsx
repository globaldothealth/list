import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useFormik } from 'formik';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { filtersToURL, URLToFilters } from './util/searchQuery';

import {
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            '& .MuiTextField-root': {
                margin: theme.spacing(1),
                width: '25ch',
            },
        },
        formControl: {
            margin: theme.spacing(1),
            minWidth: 223,
        },
        searchBtnContainer: {
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '2rem',
        },
        searchBtn: {
            marginLeft: '0.5rem',
        },
        divider: {
            margin: '2rem auto',
            height: '1px',
            width: '90%',
            backgroundColor: '#ccc',
        },
    }),
);

interface FiltersModalProps {
    isOpen: boolean;
    handleClose: () => void;
}

export interface FilterFormValues {
    country?: string;
    gender?: '' | 'Male' | 'Female';
    verificationstatus?: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    nationality?: string;
    occupation?: string;
    outcome?: string;
    variantofconcern?: string;
    dateconfirmedafter?: string;
    dateconfirmedbefore?: string;
    curatoremail?: string;
    caseid?: string;
    sourceurl?: string;
    uploadid?: string;
}

export default function FiltersModal({
    isOpen,
    handleClose,
}: FiltersModalProps) {
    const classes = useStyles();
    const location = useLocation();
    const history = useHistory();

    const [formValues, setFormValues] = useState<FilterFormValues>(
        URLToFilters(location.search),
    );

    useEffect(() => {
        const newFilters = URLToFilters(location.search);
        if (!newFilters) return;

        setFormValues(newFilters);
    }, [location.search]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: formValues,
        onSubmit: (values) => {
            handleClose();
            const searchQuery = filtersToURL(values);
            history.push({ pathname: '/cases', search: searchQuery });
        },
    });

    const handleClearFiltersClick = () => {
        setFormValues({});
        formik.resetForm();
        history.push({ pathname: '/cases', search: '' });
        handleClose();
    };

    return (
        <Dialog open={isOpen} maxWidth={'xl'} onClose={handleClose}>
            <DialogTitle>Apply filters</DialogTitle>

            <DialogContent>
                <form className={classes.root} onSubmit={formik.handleSubmit}>
                    {/* GENERAL */}
                    <div>
                        <TextField
                            id="country"
                            name="country"
                            label="Country"
                            type="text"
                            variant="outlined"
                            value={formik.values.country || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.country &&
                                Boolean(formik.errors.country)
                            }
                            helperText={
                                formik.touched.country && formik.errors.country
                            }
                        />
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                        >
                            <InputLabel id="gender-label">Gender</InputLabel>
                            <Select
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
                            </Select>
                        </FormControl>
                        <TextField
                            id="verificationStatus"
                            name="verificationstatus"
                            label="Verification status"
                            type="text"
                            variant="outlined"
                            value={formik.values.verificationstatus || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.verificationstatus &&
                                Boolean(formik.errors.verificationstatus)
                            }
                            helperText={
                                formik.touched.verificationstatus &&
                                formik.errors.verificationstatus
                            }
                        />
                    </div>

                    {/* LOCATION ADMIN */}
                    <div>
                        <TextField
                            id="admin1"
                            label="Location admin 1"
                            name="admin1"
                            type="text"
                            variant="outlined"
                            value={formik.values.admin1 || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.admin1 &&
                                Boolean(formik.errors.admin1)
                            }
                            helperText={
                                formik.touched.admin1 && formik.errors.admin1
                            }
                        />
                        <TextField
                            id="admin2"
                            label="Location admin 2"
                            name="admin2"
                            type="text"
                            variant="outlined"
                            value={formik.values.admin2 || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.admin2 &&
                                Boolean(formik.errors.admin2)
                            }
                            helperText={
                                formik.touched.admin2 && formik.errors.admin2
                            }
                        />
                        <TextField
                            id="admin3"
                            label="Location admin 3"
                            name="admin3"
                            type="text"
                            variant="outlined"
                            value={formik.values.admin3 || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.admin3 &&
                                Boolean(formik.errors.admin3)
                            }
                            helperText={
                                formik.touched.admin3 && formik.errors.admin3
                            }
                        />
                    </div>

                    <div className={classes.divider} />

                    <div>
                        <TextField
                            id="nationality"
                            label="Nationality"
                            name="nationality"
                            type="text"
                            variant="outlined"
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
                            id="occupation"
                            label="Occupation"
                            name="occupation"
                            type="text"
                            variant="outlined"
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
                        <TextField
                            id="outcome"
                            label="Outcome"
                            name="outcome"
                            type="text"
                            variant="outlined"
                            value={formik.values.outcome || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.outcome &&
                                Boolean(formik.errors.outcome)
                            }
                            helperText={
                                formik.touched.outcome && formik.errors.outcome
                            }
                        />
                    </div>

                    <div>
                        <TextField
                            id="variantofconcern"
                            label="Variant of concern"
                            name="variantofconcern"
                            type="text"
                            variant="outlined"
                            value={formik.values.variantofconcern || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.variantofconcern &&
                                Boolean(formik.errors.variantofconcern)
                            }
                            helperText={
                                formik.touched.variantofconcern &&
                                formik.errors.variantofconcern
                            }
                        />
                        <TextField
                            id="dateconfirmedbefore"
                            label="Date confirmed before"
                            name="dateconfirmedbefore"
                            type="text"
                            variant="outlined"
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
                            id="dateconfirmedafter"
                            label="Date confirmed after"
                            name="dateconfirmedafter"
                            type="text"
                            variant="outlined"
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
                            id="curatoremail"
                            label="Curator email"
                            name="curatoremail"
                            type="text"
                            variant="outlined"
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
                            id="caseid"
                            label="Case ID"
                            name="caseid"
                            type="text"
                            variant="outlined"
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
                            id="sourceurl"
                            label="Source URL"
                            name="sourceurl"
                            type="text"
                            variant="outlined"
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
                            id="uploadid"
                            label="Upload ID"
                            name="uploadid"
                            type="text"
                            variant="outlined"
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
                    </div>

                    <div className={classes.searchBtnContainer}>
                        <Button
                            color="primary"
                            variant="outlined"
                            type="button"
                            onClick={handleClearFiltersClick}
                        >
                            Clear filters
                        </Button>

                        <Button
                            color="primary"
                            variant="contained"
                            type="submit"
                            className={classes.searchBtn}
                        >
                            Filter
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
