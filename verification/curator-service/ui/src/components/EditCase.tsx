import React, { useEffect, useState } from 'react';

import { Case } from '../api/models/Case';
import CaseForm from './CaseForm';
import { LinearProgress } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';

interface Props {
    id: string;
    onModalClose: () => void;
}

export default function EditCase(props: Props): JSX.Element {
    const [c, setCase] = useState<Case>();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        setLoading(true);
        axios
            .get<Case[]>(`/api/cases/${props.id}`)
            .then((resp) => {
                setCase(resp.data[0]);
                setErrorMessage(undefined);
            })
            .catch((e) => {
                setCase(undefined);
                setErrorMessage(e.response?.data?.message || e.toString());
            })
            .finally(() => setLoading(false));
    }, [props.id]);

    return (
        <div>
            {loading && <LinearProgress />}
            {errorMessage && (
                <MuiAlert elevation={6} variant="filled" severity="error">
                    {errorMessage}
                </MuiAlert>
            )}
            {c && (
                <CaseForm initialCase={c} onModalClose={props.onModalClose} />
            )}
        </div>
    );
}
