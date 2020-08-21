import React from 'react';
import { render } from '@testing-library/react';
import SourceRetrievalButton from './SourceRetrievalButton';

it('renders button', async () => {
    const { getByTestId } = render(<SourceRetrievalButton sourceId="foo" />);
    const btn = getByTestId('trigger-retrieval-btn-foo');
    expect(btn).toBeInTheDocument();
});
