import {
    SelectField,
} from '../common-form-fields/FormikFields';

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
          <strong>Variant of Concern:</strong> Enter the variant of concern (VOC) for the case. If no VOC is provided
          then you can leave it blank.
      </span>
    </StyledTooltip>
  );
  
export default function Variant(): JSX.Element {
    return <Scroll.Element name="variantOfConcern">
        <FieldTitle
        title="Variant of Concern"
        tooltip={<TooltipText />}>
        </FieldTitle>
        <SelectField
            name="variantName"
            label="Name"
            values={variantNames}
        ></SelectField>
    </Scroll.Element>
};
