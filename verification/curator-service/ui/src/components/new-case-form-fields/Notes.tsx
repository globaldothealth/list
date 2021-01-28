import { FastField } from 'formik';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

const TooltipText = () => (
  <StyledTooltip>
    <ul>
      <li>Provide any additional detils that may not fit into any of the previous sections.</li>
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
