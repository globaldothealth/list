import { SelectField } from '../common-form-fields/FormikFields';

import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import React from 'react';
import Scroll from 'react-scroll';
import _ from 'lodash';

import variants from '../assets/variants.json';

const variantNames = _.map(variants, (v) => v.Name);

const TooltipText = () => (
    <StyledTooltip>
        <span>
            <strong>Variant of Concern:</strong> Enter the variant of concern
            (VOC) for the case. If no VOC is provided then you can leave it
            blank.
        </span>
    </StyledTooltip>
);

const SGTFToolTip = () => (
    <StyledTooltip>
        <span>
            <strong>S-Gene Dropout:</strong> Enter 1 if S-Gene target failure
            (SGTF) was detected, or 0 if it was not detected. If SGTF was not
            tested then you can leave it blank or select NA.
        </span>
    </StyledTooltip>
);

export default function Variant(): JSX.Element {
    return (
        <Scroll.Element name="variantOfConcern">
            <FieldTitle
                title="Variant of Concern"
                tooltip={<TooltipText />}
            ></FieldTitle>
            <SelectField
                name="variantName"
                label="Name"
                values={variantNames}
            ></SelectField>
            <FieldTitle title="S-Gene dropout?" tooltip={<SGTFToolTip />} />
            <SelectField name="SGTF" label="SGTF" values={['0', '1', 'NA']} />
        </Scroll.Element>
    );
}
