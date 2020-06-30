import {
    Container,
    Grid,
    LinearProgress,
    Paper,
    Typography,
} from '@material-ui/core';

import { Case } from './Case';
import MuiAlert from '@material-ui/lab/Alert';
import React from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core';

interface Props {
    id: string;
}

interface State {
    case?: Case;
    errorMessage?: string;
    loading: boolean;
}

class ViewCase extends React.Component<Props, State> {
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
                {this.state.case && <CaseDetails c={this.state.case} />}
            </div>
        );
    }
}

interface CaseDetailsProps {
    c: Case;
}

const useStyles = makeStyles((theme) => ({
    paper: {
        background: theme.palette.background.default,
        marginTop: '1em',
    },
    grid: {
        margin: '1em',
    },
    sectionTitle: {
        margin: '1em',
    },
}));

function ageRange(range?: { start: number; end: number }): string {
    if (!range) {
        return '';
    }
    return range.start === range.end
        ? `${range.start}`
        : `${range.start}-${range.end}`;
}

function CaseDetails(props: CaseDetailsProps): JSX.Element {
    const classes = useStyles();
    return (
        <Container maxWidth="sm">
            <Typography variant="h5">Case {props.c._id}</Typography>
            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Case data
                </Typography>
                <Grid container className={classes.grid}>
                    <RowHeader title="Data source" />
                    {/* TODO: Display data source name once we store those */}
                    <RowContent content="" />

                    <RowHeader title="Data source link" />
                    <RowContent
                        content={
                            props.c.sources.length > 0
                                ? props.c.sources[0].url
                                : ''
                        }
                        isLink
                    />

                    <RowHeader title="Date of creation" />
                    <RowContent
                        content={
                            props.c.revisionMetadata?.creationMetadata?.date ||
                            ''
                        }
                    />

                    <RowHeader title="Created by" />
                    <RowContent
                        content={
                            props.c.revisionMetadata?.creationMetadata
                                ?.curator || ''
                        }
                    />
                </Grid>
            </Paper>

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Demographics
                </Typography>
                <Grid container className={classes.grid}>
                    <RowHeader title="Age" />
                    <RowContent
                        content={ageRange(props.c.demographics?.ageRange)}
                    />

                    <RowHeader title="Sex" />
                    <RowContent content={props.c.demographics?.sex} />

                    <RowHeader title="Profession" />
                    <RowContent content={props.c.demographics?.profession} />

                    <RowHeader title="Nationality" />
                    <RowContent
                        content={props.c.demographics?.nationalities?.join(
                            ', ',
                        )}
                    />

                    <RowHeader title="Ethnicity" />
                    <RowContent content={props.c.demographics?.ethnicity} />
                </Grid>
            </Paper>
        </Container>
    );
}

function RowHeader(props: { title: string }): JSX.Element {
    return (
        <Grid item xs={4}>
            <Typography variant="body2">{props.title}</Typography>
        </Grid>
    );
}

function RowContent(props: { content: string; isLink?: boolean }): JSX.Element {
    return (
        <Grid item xs={8}>
            {props.isLink ? (
                <a href={props.content}>{props.content}</a>
            ) : (
                props.content
            )}
        </Grid>
    );
}

export default ViewCase;
