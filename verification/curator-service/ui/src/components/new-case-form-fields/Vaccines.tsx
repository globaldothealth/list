import React from 'react';
import { FastField, FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import CancelIcon from '@material-ui/icons/Cancel';
import CaseFormValues from './CaseFormValues';
import { DateField } from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core';
import shortId from 'shortid';

const TooltipText = () => (
    <StyledTooltip>
        <p>I don't know what the tool tip will need to say yet.</p>
    </StyledTooltip>
);

export default function Vaccines(): JSX.Element {
    const { values } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="vaccines">
            <FieldTitle
                title="Vaccines"
                interactive
                tooltip={<TooltipText />}
            ></FieldTitle>
            <FieldArray name="vaccines">
                {({ push, remove }): JSX.Element => {
                    return (
                        <div><p>Vaccine form here!</p>
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
                                Add vaccine
                            </Button>
                        </div>
                    );
                }}
            </FieldArray>
        </Scroll.Element>
    );
}