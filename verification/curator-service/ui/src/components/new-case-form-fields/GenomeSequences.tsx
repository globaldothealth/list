import { FastField, FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import CancelIcon from '@material-ui/icons/Cancel';
import CaseFormValues from './CaseFormValues';
import { DateField } from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core';
import shortId from 'shortid';

const useStyles = makeStyles(() => ({
    genomeSequenceTitle: {
        alignItems: 'center',
        display: 'flex',
    },
    spacer: {
        flex: '1',
    },
    field: {
        marginBottom: '2em',
    },
}));

export default function GenomeSequences(): JSX.Element {
    const { values } = useFormikContext<CaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="genomeSequences">
            <FieldTitle title="Genome Sequences"></FieldTitle>
            <FieldArray name="genomeSequences">
                {({ push, remove }): JSX.Element => {
                    return (
                        <div>
                            {values.genomeSequences &&
                                values.genomeSequences.map(
                                    (genomeSequence, index) => (
                                        <div
                                            key={genomeSequence.reactId}
                                            data-testid={
                                                'genome-sequence-section'
                                            }
                                        >
                                            <div
                                                className={
                                                    classes.genomeSequenceTitle
                                                }
                                            >
                                                {`Genome sequence ${index + 1}`}
                                                <span
                                                    className={classes.spacer}
                                                ></span>
                                                <Button
                                                    startIcon={<CancelIcon />}
                                                    data-testid={
                                                        'remove-genome-sequence-button'
                                                    }
                                                    onClick={(): void => {
                                                        remove(index);
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            <DateField
                                                name={`genomeSequences[${index}].sampleCollectionDate`}
                                                label="Sample collection date"
                                            ></DateField>
                                            <FastField
                                                className={classes.field}
                                                name={`genomeSequences[${index}].repositoryUrl`}
                                                type="text"
                                                label="Repository URL"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                            <FastField
                                                className={classes.field}
                                                name={`genomeSequences[${index}].sequenceId`}
                                                type="text"
                                                label="Sequence accession"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                            <FastField
                                                className={classes.field}
                                                name={`genomeSequences[${index}].sequenceName`}
                                                type="text"
                                                label="Sequence name"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                            <FastField
                                                className={classes.field}
                                                name={`genomeSequences[${index}].sequenceLength`}
                                                type="number"
                                                label="Sequence length"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                        </div>
                                    ),
                                )}

                            <Button
                                data-testid="addGenomeSequence"
                                startIcon={<AddCircleIcon />}
                                onClick={(): void => {
                                    push({
                                        reactId: shortId.generate(),
                                        sampleCollectionDate: null,
                                    });
                                }}
                            >
                                Add genome sequence
                            </Button>
                        </div>
                    );
                }}
            </FieldArray>
        </Scroll.Element>
    );
}
