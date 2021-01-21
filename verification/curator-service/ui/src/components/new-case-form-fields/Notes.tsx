import { FastField } from 'formik';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

const TooltipText = () => (
  <StyledTooltip>
    <ul>
      <li>Add any additional notes you want to include in the line list case</li>
    </ul>
  </StyledTooltip>
);

export default function Notes(): JSX.Element {
    return (
        <Scroll.Element name="notes">
            <FieldTitle
              title="Notes"
              tooltip={<TooltipText />}
            ></FieldTitle>
            <FastField
                label="Notes"
                name="notes"
                type="text"
                multiline={true}
                component={TextField}
                fullWidth
            />
        </Scroll.Element>
    );
}
