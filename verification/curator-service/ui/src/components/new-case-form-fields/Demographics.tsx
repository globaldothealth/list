import { FastField, useFormikContext } from 'formik';
import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import { Chip } from '@material-ui/core';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { StyledTooltip } from './StyledTooltip';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';

const styles = makeStyles(() => ({
    fieldRow: {
        marginBottom: '2em',
    },
    ageRow: {
        alignItems: 'baseline',
        display: 'flex',
    },
    ageField: {
        width: '8em',
    },
    ageSeparator: {
        margin: '0 2em',
    },
    select: {
        width: '8em',
    },
    chip: {
        margin: '0.5em',
    },
    section: {
        marginBottom: '1em',
    },
}));

// If changing this list, also modify https://github.com/globaldothealth/list/blob/main/data-serving/data-service/api/openapi.yaml
const genderValues = [
    'Unknown',
    'Male',
    'Female',
    'Non-binary/Third gender',
    'Other',
];

const TooltipText = () => (
  <StyledTooltip>
    <ul>
      <li><strong>Gender:</strong> Enter the Gender of the case provided. If no gender is provided select Unknown.</li>
      <li><strong>Age:</strong> Enter the age of the case.
        <ul>
          <li>If a range is provided enter in the min and max fields.</li>
          <li>If an exact age is provided enter it in the age field.</li>
          <li>Note: If the data source provides an age range such as 65{'>'} or 65+ tthen set the minimum age value as 65 and the maximum age value to 120 (the maximum allowed age value).</li>
        </ul>
      </li>
      <li><strong>Ethnicity / Race:</strong> Enter the Ethnicity of the case provided. If no data is provided leave blank.</li>
      <li><strong>Nationality:</strong> Enter the Nationality of the case. If no data is provided leave blank.</li>
      <li><strong>Occupation:</strong> Enter the Occupation of the case. If no data is provided leave blank.</li>
    </ul>
  </StyledTooltip>
);

export default function Demographics(): JSX.Element {
    const classes = styles();
    const { initialValues, setFieldValue } = useFormikContext<CaseFormValues>();
    const [commonOccupations, setCommonOccupations] = React.useState([]);

    React.useEffect(
        () => {
            axios
                .get('/api/cases/occupations?limit=10')
                .then((response) =>
                    setCommonOccupations(response.data.occupations ?? []),
                );
        },
        // Using [] here means this will only be called once at the beginning of the lifecycle
        [],
    );

    return (
        <Scroll.Element name="demographics">
            <FieldTitle
              title="Demographics"
              tooltip={<TooltipText />}
            ></FieldTitle>
            <SelectField
                name="gender"
                label="Gender"
                values={genderValues}
            ></SelectField>
            <div className={`${classes.fieldRow} ${classes.ageRow}`}>
                <FastField
                    className={classes.ageField}
                    name="minAge"
                    type="number"
                    label="Min age"
                    component={TextField}
                ></FastField>
                <span className={classes.ageSeparator}>to</span>
                <FastField
                    className={classes.ageField}
                    name="maxAge"
                    type="number"
                    label="Max age"
                    component={TextField}
                ></FastField>
                <span className={classes.ageSeparator}>or</span>
                <FastField
                    className={classes.ageField}
                    name="age"
                    type="number"
                    label="Age"
                    component={TextField}
                ></FastField>
            </div>
            <div className={classes.fieldRow}>
                <FastField
                    label="Race / Ethnicity"
                    name="ethnicity"
                    type="text"
                    data-testid="ethnicity"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={classes.fieldRow}>
                <FormikAutocomplete
                    name="nationalities"
                    label="Nationalities"
                    initialValue={initialValues.nationalities}
                    multiple={true}
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/nationalities.txt"
                />
            </div>
            {commonOccupations.length > 0 && (
                <>
                    <div className={classes.section}>
                        Frequently added occupations
                    </div>
                    <div className={classes.section}>
                        {commonOccupations.map(
                            (occupation) =>
                                occupation && (
                                    <Chip
                                        key={occupation}
                                        className={classes.chip}
                                        label={occupation}
                                        onClick={(): void =>
                                            setFieldValue(
                                                'occupation',
                                                occupation,
                                            )
                                        }
                                    ></Chip>
                                ),
                        )}
                    </div>
                </>
            )}
            <FormikAutocomplete
                name="occupation"
                label="Occupation"
                initialValue={initialValues.occupation}
                multiple={false}
                freeSolo
                optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/occupations.txt"
            />
        </Scroll.Element>
    );
}
