import { Case } from './Case';
import CaseForm from './CaseForm';
import { LinearProgress } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import React from 'react';
import User from './User';
import axios from 'axios';

interface Props {
    user: User;
    id: string;
    onModalClose?: () => void;
}

interface State {
    case?: Case;
    errorMessage?: string;
    loading: boolean;
}

class EditCase extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { loading: false };
    }
    componentDidMount(): void {
        this.setState({ loading: true });
        axios
            .get<Case>(`/api/cases/${this.props.id}`)
            .then((resp) => {
                this.setState({ case: resp.data, errorMessage: undefined });
            })
            .catch((e) => {
                this.setState({ case: undefined, errorMessage: e.message });
            })
            .finally(() => this.setState({ loading: false }));
    }

    render(): JSX.Element {
        return (
            <div>
                {this.state.loading && <LinearProgress />}
                {this.state.errorMessage && (
                    <MuiAlert elevation={6} variant="filled" severity="error">
                        {this.state.errorMessage}
                    </MuiAlert>
                )}
                {this.state.case && (
                    <CaseForm
                        user={this.props.user}
                        initialCase={this.state.case}
                        onModalClose={this.props.onModalClose}
                    />
                )}
            </div>
        );
    }
}

export default EditCase;
