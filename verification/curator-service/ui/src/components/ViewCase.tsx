import { Case, Location, Travel } from './Case';
import {
    Container,
    Grid,
    LinearProgress,
    Paper,
    Typography,
} from '@material-ui/core';

import MuiAlert from '@material-ui/lab/Alert';
import React from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core';
import shortId from 'shortid';

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
    caseTitle: {
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

function dateRange(range?: { start: string; end: string }): string {
    if (!range) {
        return '';
    }
    return range.start === range.end
        ? `${range.start}`
        : `${range.start} - ${range.end}`;
}

function CaseDetails(props: CaseDetailsProps): JSX.Element {
    const classes = useStyles();
    return (
        <Container maxWidth="sm">
            <Typography className={classes.caseTitle} variant="h5">
                Case {props.c._id}
            </Typography>
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
                        content={props.c.caseReference?.sourceUrl}
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

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Location
                </Typography>
                <Grid container className={classes.grid}>
                    <LocationRows loc={props.c.location} />
                </Grid>
            </Paper>

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Event history
                </Typography>
                <Grid container className={classes.grid}>
                    <RowHeader title="Confirmed case date" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find((e) => e.name === 'confirmed')
                                ?.dateRange,
                        )}
                    />

                    <RowHeader title="Confirmation method" />
                    <RowContent
                        content={
                            props.c.events?.find((e) => e.name === 'confirmed')
                                ?.value || ''
                        }
                    />

                    <RowHeader title="Symptom onset date" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find(
                                (e) => e.name === 'onsetSymptoms',
                            )?.dateRange,
                        )}
                    />

                    <RowHeader title="First clinical consultation" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find(
                                (e) => e.name === 'firstClinicalConsultation',
                            )?.dateRange,
                        )}
                    />

                    <RowHeader title="Date of self isolation" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find(
                                (e) => e.name === 'selfIsolation',
                            )?.dateRange,
                        )}
                    />

                    <RowHeader title="Hospital admission" />
                    <RowContent
                        content={
                            props.c.events?.find(
                                (e) => e.name === 'hospitalAdmission',
                            )?.value || ''
                        }
                    />

                    <RowHeader title="Hospital admission date" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find(
                                (e) => e.name === 'hospitalAdmission',
                            )?.dateRange,
                        )}
                    />

                    <RowHeader title="Date admitted to isolation unit" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find(
                                (e) => e.name === 'icuAdmission',
                            )?.dateRange,
                        )}
                    />

                    <RowHeader title="Outcome" />
                    <RowContent
                        content={
                            props.c.events?.find((e) => e.name === 'outcome')
                                ?.value || ''
                        }
                    />

                    <RowHeader title="Outcome date" />
                    <RowContent
                        content={dateRange(
                            props.c.events?.find((e) => e.name === 'outcome')
                                ?.dateRange,
                        )}
                    />
                </Grid>
            </Paper>

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Symptoms
                </Typography>
                <Grid container className={classes.grid}>
                    <RowHeader title="Symptoms" />
                    <RowContent
                        content={props.c.symptoms?.values?.join(', ')}
                    />

                    <RowHeader title="Pre existing conditions" />
                    <RowContent
                        content={
                            props.c.preexistingConditions?.values?.join(', ') ||
                            ''
                        }
                    />
                </Grid>
            </Paper>

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Transmission
                </Typography>
                <Grid container className={classes.grid}>
                    <RowHeader title="Route of transmission" />
                    <RowContent
                        content={props.c.transmission?.routes?.join(', ')}
                    />

                    <RowHeader title="Places of transmission" />
                    <RowContent
                        content={props.c.transmission?.places?.join(', ')}
                    />

                    <RowHeader title="Related cases" />
                    <MultilinkRowContent
                        links={props.c.transmission?.linkedCaseIds?.map((e) => {
                            return {
                                title: e,
                                link: `/cases/view/${e}`,
                            };
                        })}
                    />
                </Grid>
            </Paper>

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Travel history
                </Typography>
                <Grid container className={classes.grid}>
                    <RowHeader title="Travelled in last 30 days" />
                    <RowContent
                        content={
                            props.c.travelHistory?.traveledPrior30Days
                                ? 'Yes'
                                : 'No'
                        }
                    />

                    {props.c.travelHistory?.travel?.map((e) => (
                        <TravelRow key={shortId.generate()} travel={e} />
                    ))}
                </Grid>
            </Paper>

            <Paper className={classes.paper} variant="outlined" square>
                <Typography className={classes.sectionTitle} variant="overline">
                    Pathogens & genome sequencing
                </Typography>
                {/* TODO */}
            </Paper>
        </Container>
    );
}

function LocationRows(props: { loc?: Location }): JSX.Element {
    return (
        <>
            <RowHeader title="Location" />
            <RowContent content={props.loc?.name || ''} />

            <RowHeader title="Location type" />
            <RowContent content={props.loc?.geoResolution || ''} />

            <RowHeader title="Admin area 1" />
            <RowContent content={props.loc?.administrativeAreaLevel1 || ''} />

            <RowHeader title="Admin area 2" />
            <RowContent content={props.loc?.administrativeAreaLevel2 || ''} />

            <RowHeader title="Admin area 3" />
            <RowContent content={props.loc?.administrativeAreaLevel3 || ''} />

            <RowHeader title="Country" />
            <RowContent content={props.loc?.country || ''} />

            <RowHeader title="Latitude" />
            <RowContent
                content={`${props.loc?.geometry?.latitude?.toFixed(4)}`}
            />
            <RowHeader title="Longitude" />
            <RowContent
                content={`${props.loc?.geometry?.longitude?.toFixed(4)}`}
            />
            {/* TODO: A static map would be nice here. */}
        </>
    );
}

function TravelRow(props: { travel: Travel }): JSX.Element {
    return (
        <>
            <RowHeader title="Methods of travel" isSeparated />
            <RowContent content={props.travel.methods?.join(', ') || ''} />

            <RowHeader title="Travel dates" />
            <RowContent content={dateRange(props.travel.dateRange)} />

            <RowHeader title="Primary reason of travel" />
            <RowContent content={props.travel.purpose || ''} />

            <LocationRows loc={props.travel.location} />
        </>
    );
}

const headerStyles = makeStyles(() => ({
    separatedHeader: {
        marginTop: '2em',
    },
}));

function RowHeader(props: {
    title: string;
    isSeparated?: boolean;
}): JSX.Element {
    const classes = headerStyles();
    return (
        <Grid
            className={props.isSeparated ? classes.separatedHeader : ''}
            item
            xs={4}
        >
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

function MultilinkRowContent(props: {
    links?: { title: string; link: string }[];
}): JSX.Element {
    return (
        <Grid item xs={8}>
            {props.links?.map((e) => (
                <p key={e.title}>
                    <a href={e.link}>{e.title}</a>
                </p>
            ))}
        </Grid>
    );
}

export default ViewCase;
