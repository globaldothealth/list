import AppModal from './AppModal';
import React from 'react';
import User from './User';
interface Props {
    user: User;
    onModalClose: () => void;
}

export default function AutomatedSourceForm(props: Props): JSX.Element {
    return (
        <AppModal
            title="New automated data source"
            onModalClose={props.onModalClose}
        >
            <h3>Provide details about the automated data source</h3>
        </AppModal>
    );
}
