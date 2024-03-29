import React from 'react';
import { FastField, FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Button from '@mui/material/Button';
import CancelIcon from '@mui/icons-material/Cancel';
import CaseFormValues from './CaseFormValues';
import { DateField } from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import makeStyles from '@mui/styles/makeStyles';
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

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Add a Genome sequence:</strong> Allows for a genome
                sequence to be linked to a specific reported case. If the source
                has a linked genome case select add and complete all of the
                fields you are able to.
            </li>
            <li>
                <strong>Sample collection date:</strong> Date the sample was
                collected on.
            </li>
            <li>
                <strong>Repository URL:</strong> URL link to the location that
                the sequence is stored. e.g. GISAID and Genbank URL.
            </li>
            <li>
                <strong>Sequence accession:</strong> The sequence accession, see{' '}
                <a
                    href="https://www.ncbi.nlm.nih.gov/genbank/sequenceids/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    here
                </a>{' '}
                for format details
            </li>
            <li>
                <strong>Sequence name:</strong> The name of the sequence.
            </li>
            <li>
                <strong>Sequence length:</strong> The length of the sequence.
            </li>
        </ul>
    </StyledTooltip>
);

export default function GenomeSequences(): JSX.Element {
    const { values, setValues } = useFormikContext<CaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="genomeSequences">
            <FieldTitle
                title="Genome Sequences"
                interactive
                tooltip={<TooltipText />}
            ></FieldTitle>
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
                                                value={
                                                    values.genomeSequences[
                                                        index
                                                    ].sampleCollectionDate
                                                }
                                                onChange={(newValue) => {
                                                    const reactId =
                                                        values.genomeSequences[
                                                            index
                                                        ].reactId;

                                                    const newGenomeSequences =
                                                        values.genomeSequences.map(
                                                            (element) =>
                                                                element.reactId ===
                                                                reactId
                                                                    ? {
                                                                          ...element,
                                                                          sampleCollectionDate:
                                                                              newValue as string,
                                                                      }
                                                                    : element,
                                                        );

                                                    setValues({
                                                        ...values,
                                                        genomeSequences:
                                                            newGenomeSequences,
                                                    });
                                                }}
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
