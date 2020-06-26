import { Field, FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import { DateField } from './FormikFields';
import NewCaseFormValues from './NewCaseFormValues';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    genomeSequenceSection: {
        margin: '1em',
    },
    field: {
        marginBottom: '2em',
    },
}));

export default function GenomeSequences(): JSX.Element {
    const { values } = useFormikContext<NewCaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="genomeSequences">
            <fieldset>
                <legend>Genome Sequences</legend>
                <FieldArray name="genomeSequences">
                    {({ push }): JSX.Element => {
                        return (
                            <div>
                                {values.genomeSequences &&
                                    values.genomeSequences.map((_, index) => (
                                        <fieldset
                                            key={index}
                                            className={
                                                classes.genomeSequenceSection
                                            }
                                        >
                                            <DateField
                                                name={`genomeSequences[${index}].sampleCollectionDate`}
                                                label="Sample collection date"
                                            ></DateField>
                                            <Field
                                                className={classes.field}
                                                name={`genomeSequences[${index}].repositoryUrl`}
                                                type="text"
                                                label="Repository URL"
                                                fullWidth
                                                component={TextField}
                                            ></Field>
                                            <Field
                                                className={classes.field}
                                                name={`genomeSequences[${index}].sequenceId`}
                                                type="text"
                                                label="Sequence ID"
                                                fullWidth
                                                component={TextField}
                                            ></Field>
                                            <Field
                                                className={classes.field}
                                                name={`genomeSequences[${index}].sequenceName`}
                                                type="text"
                                                label="Sequence name"
                                                fullWidth
                                                component={TextField}
                                            ></Field>
                                            <Field
                                                className={classes.field}
                                                name={`genomeSequences[${index}].sequenceLength`}
                                                type="number"
                                                label="Sequence length"
                                                fullWidth
                                                component={TextField}
                                            ></Field>
                                            <Field
                                                name={`genomeSequences[${index}].notes`}
                                                type="text"
                                                label="Notes"
                                                multiline={true}
                                                fullWidth
                                                rows="3"
                                                component={TextField}
                                            ></Field>
                                        </fieldset>
                                    ))}

                                <Button
                                    data-testid="addGenomeSequence"
                                    startIcon={<AddCircleIcon />}
                                    onClick={(): void => {
                                        push({ sampleCollectionDate: null });
                                    }}
                                >
                                    Add genome sequence
                                </Button>
                            </div>
                        );
                    }}
                </FieldArray>
            </fieldset>
        </Scroll.Element>
    );
}
