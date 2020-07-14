import { Case, Pathogen, Travel, TravelHistory } from './Case';
import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';

import AddIcon from '@material-ui/icons/AddOutlined';
import CaseForm from './CaseForm';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditCase from './EditCase';
import EditIcon from '@material-ui/icons/EditOutlined';
import MuiAlert from '@material-ui/lab/Alert';
import Paper from '@material-ui/core/Paper';
import User from './User';
import ViewCase from './ViewCase';
import VisibilityIcon from '@material-ui/icons/VisibilityOutlined';
import axios from 'axios';

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

interface LinelistTableState {
    url: string;
    error: string;
    showCaseForm: boolean;
    caseFormId: string;
    showCaseDetails: boolean;
    caseDetailsId: string;
    pageSize: number;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    // demographics
    sex: string;
    age: [number, number]; // start, end.
    ethnicity: string;
    // Represents a list as a comma and space separated string e.g. 'Afghan, Albanian'
    nationalities: string;
    profession: string;
    country: string;
    adminArea1: string;
    adminArea2: string;
    adminArea3: string;
    geoResolution: string;
    locationName: string;
    latitude: number;
    longitude: number;
    confirmedDate: Date | null;
    confirmationMethod: string;
    // Represents a list as a comma and space separated string e.g. 'fever, cough'
    symptoms: string;
    // Represents a list as a comma and space separated string e.g. 'vertical, iatrogenic'
    transmissionRoutes: string;
    // Represents a list as a comma and space separated string e.g. 'gym, hospital'
    transmissionPlaces: string;
    // Represents a list as a comma and space separated string e.g. 'caseId, caseId2'
    transmissionLinkedCaseIds: string;
    travelHistory: TravelHistory;
    pathogens: Pathogen[];
    sourceUrl: string | null;
    notes: string;
    curatedBy: string;
    outcome: string;
    admittedToHospital: string;
}

interface Props {
    user: User;
}

export default class LinelistTable extends React.Component<
    Props,
    LinelistTableState
> {
    tableRef: RefObject<any> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
            showCaseForm: false,
            caseFormId: '',
            showCaseDetails: false,
            caseDetailsId: '',
            pageSize: 50,
        };
        this.closeCaseForm = this.closeCaseForm.bind(this);
    }

    deleteCase(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const deleteUrl = this.state.url + rowData.id;
            this.setState({ error: '' });
            const response = axios.delete(deleteUrl);
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
    }

    closeCaseForm(): void {
        this.setState({ showCaseForm: false, caseFormId: '' });
        this.tableRef.current.onQueryChange();
    }

    render(): JSX.Element {
        return (
            <>
                {this.state.showCaseForm &&
                    (this.state.caseFormId === '' ? (
                        <CaseForm
                            user={this.props.user}
                            onModalClose={this.closeCaseForm}
                        ></CaseForm>
                    ) : (
                        <EditCase
                            user={this.props.user}
                            id={this.state.caseFormId}
                            onModalClose={this.closeCaseForm}
                        ></EditCase>
                    ))}
                {this.state.showCaseDetails && (
                    <ViewCase
                        id={this.state.caseDetailsId}
                        onModalClose={() =>
                            this.setState({
                                showCaseDetails: false,
                                caseDetailsId: '',
                            })
                        }
                    ></ViewCase>
                )}
                <Paper>
                    {this.state.error && (
                        <MuiAlert
                            elevation={6}
                            variant="filled"
                            severity="error"
                        >
                            {this.state.error}
                        </MuiAlert>
                    )}
                    <MaterialTable
                        tableRef={this.tableRef}
                        columns={[
                            {
                                title: 'id',
                                field: 'id',
                                type: 'string',
                                hidden: true,
                            },
                            {
                                title: 'Sex',
                                field: 'sex',
                                lookup: { Female: 'Female', Male: 'Male' },
                            },
                            {
                                title: 'Age',
                                field: 'age',
                                render: (rowData) =>
                                    rowData.age[0] === rowData.age[1]
                                        ? rowData.age[0]
                                        : `${rowData.age[0]}-${rowData.age[1]}`,
                            },
                            {
                                title: 'Ethnicity',
                                field: 'ethnicity',
                            },
                            {
                                title: 'Nationality',
                                field: 'nationalities',
                            },
                            {
                                title: 'Profession',
                                field: 'profession',
                            },
                            {
                                title: 'Location',
                                field: 'locationName',
                            },
                            {
                                title: 'Country',
                                field: 'country',
                            },
                            {
                                title: 'Confirmed date',
                                field: 'confirmedDate',
                                type: 'date',
                            },
                            {
                                title: 'Confirmation method',
                                field: 'confirmationMethod',
                            },
                            {
                                title: 'Admitted to hospital',
                                field: 'admittedToHospital',
                            },
                            {
                                title: 'Outcome',
                                field: 'outcome',
                            },
                            {
                                title: 'Symptoms',
                                field: 'symptoms',
                            },
                            {
                                title: 'Routes of transmission',
                                field: 'transmissionRoutes',
                            },
                            {
                                title: 'Places of transmission',
                                field: 'transmissionPlaces',
                            },
                            {
                                title: 'Contacted case IDs',
                                field: 'transmissionLinkedCaseIds',
                            },
                            {
                                title: 'Travel history',
                                field: 'travelHistory',
                                render: (rowData): string =>
                                    rowData.travelHistory?.travel
                                        ?.map(
                                            (travel: Travel) =>
                                                travel.location?.name,
                                        )
                                        ?.join(', '),
                            },
                            {
                                title: 'Pathogens',
                                field: 'pathogens',
                                render: (rowData): string =>
                                    rowData.pathogens
                                        ?.map(
                                            (pathogen: Pathogen) =>
                                                pathogen.name,
                                        )
                                        ?.join(', '),
                            },
                            { title: 'Notes', field: 'notes' },
                            {
                                title: 'Source URL',
                                field: 'sourceUrl',
                            },
                            {
                                title: 'Curated by',
                                field: 'curatedBy',
                                tooltip:
                                    'If unknown, this is most likely an imported case',
                            },
                        ]}
                        data={(query): Promise<QueryResult<TableRow>> =>
                            new Promise((resolve, reject) => {
                                let listUrl = this.state.url;
                                listUrl += '?limit=' + this.state.pageSize;
                                listUrl += '&page=' + (query.page + 1);
                                const trimmedQ = query.search.trim();
                                // TODO: We should probably use lodash.throttle on searches.
                                if (trimmedQ) {
                                    listUrl +=
                                        '&q=' +
                                        encodeURIComponent(query.search);
                                }
                                this.setState({ error: '' });
                                const response = axios.get<ListResponse>(
                                    listUrl,
                                );
                                response
                                    .then((result) => {
                                        const flattenedCases: TableRow[] = [];
                                        const cases = result.data.cases;
                                        for (const c of cases) {
                                            const confirmedEvent = c.events.find(
                                                (event) =>
                                                    event.name === 'confirmed',
                                            );
                                            flattenedCases.push({
                                                id: c._id,
                                                sex: c.demographics?.sex,
                                                age: [
                                                    c.demographics?.ageRange
                                                        ?.start,
                                                    c.demographics?.ageRange
                                                        ?.end,
                                                ],
                                                ethnicity:
                                                    c.demographics?.ethnicity,
                                                nationalities: c.demographics?.nationalities?.join(
                                                    ', ',
                                                ),
                                                profession:
                                                    c.demographics?.profession,
                                                country: c.location.country,
                                                adminArea1:
                                                    c.location
                                                        ?.administrativeAreaLevel1,
                                                adminArea2:
                                                    c.location
                                                        ?.administrativeAreaLevel2,
                                                adminArea3:
                                                    c.location
                                                        ?.administrativeAreaLevel3,
                                                latitude:
                                                    c.location?.geometry
                                                        ?.latitude,
                                                longitude:
                                                    c.location?.geometry
                                                        ?.longitude,
                                                geoResolution:
                                                    c.location?.geoResolution,
                                                locationName: c.location?.name,
                                                confirmedDate: confirmedEvent
                                                    ?.dateRange?.start
                                                    ? new Date(
                                                          confirmedEvent.dateRange.start,
                                                      )
                                                    : null,
                                                confirmationMethod:
                                                    confirmedEvent?.value || '',
                                                symptoms: c.symptoms?.values?.join(
                                                    ', ',
                                                ),
                                                transmissionRoutes: c.transmission?.routes.join(
                                                    ', ',
                                                ),
                                                transmissionPlaces: c.transmission?.places.join(
                                                    ', ',
                                                ),
                                                transmissionLinkedCaseIds: c.transmission?.linkedCaseIds.join(
                                                    ', ',
                                                ),
                                                travelHistory: c.travelHistory,
                                                pathogens: c.pathogens,
                                                notes: c.notes,
                                                sourceUrl:
                                                    c.caseReference?.sourceUrl,
                                                curatedBy:
                                                    c.revisionMetadata
                                                        ?.creationMetadata
                                                        ?.curator || 'Unknown',
                                                admittedToHospital:
                                                    c.events.find(
                                                        (event) =>
                                                            event.name ===
                                                            'hospitalAdmission',
                                                    )?.value || 'Unknown',
                                                outcome:
                                                    c.events.find(
                                                        (event) =>
                                                            event.name ===
                                                            'outcome',
                                                    )?.value || 'Unknown',
                                            });
                                        }
                                        resolve({
                                            data: flattenedCases,
                                            page: query.page,
                                            totalCount: result.data.total,
                                        });
                                    })
                                    .catch((e) => {
                                        this.setState({ error: e.toString() });
                                        reject(e);
                                    });
                            })
                        }
                        title="COVID-19 cases"
                        options={{
                            search: true,
                            filtering: false,
                            sorting: false, // Would be nice but has to wait on indexes to properly query the DB.
                            padding: 'dense',
                            draggable: false, // No need to be able to drag and drop headers.
                            selection: true,
                            pageSize: this.state.pageSize,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                            actionsColumnIndex: -1,
                            maxBodyHeight: 'calc(100vh - 15em)',
                        }}
                        onChangeRowsPerPage={(newPageSize: number) => {
                            this.setState({ pageSize: newPageSize });
                            this.tableRef.current.onQueryChange();
                        }}
                        // actions cannot be a function https://github.com/mbrn/material-table/issues/676
                        actions={
                            this.props.user.roles.includes('curator')
                                ? [
                                      {
                                          icon: () => (
                                              <span aria-label="add">
                                                  <AddIcon />
                                              </span>
                                          ),
                                          tooltip: 'Submit new case',
                                          isFreeAction: true,
                                          onClick: (): void => {
                                              this.setState({
                                                  showCaseForm: true,
                                                  caseFormId: '',
                                              });
                                          },
                                      },
                                      {
                                          icon: () => (
                                              <span aria-label="edit">
                                                  <EditIcon />
                                              </span>
                                          ),
                                          tooltip: 'Edit this case',
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          onClick: (_: any, row: any): void => {
                                              // Somehow the templating system doesn't think row has an id property but it has.
                                              const id = (row as TableRow).id;
                                              this.setState({
                                                  showCaseForm: true,
                                                  caseFormId: id,
                                              });
                                          },
                                          position: 'row',
                                      },
                                      // This action is for deleting selected rows.
                                      // The action for deleting single rows is in the
                                      // editable section.
                                      {
                                          icon: () => (
                                              <span aria-label="delete all">
                                                  <DeleteIcon />
                                              </span>
                                          ),
                                          tooltip: 'Delete selected rows',
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          onClick: (
                                              _: any,
                                              rows: any,
                                          ): void => {
                                              rows.forEach((row: TableRow) =>
                                                  this.deleteCase(row),
                                              );
                                              this.tableRef.current.onQueryChange();
                                          },
                                      },
                                      {
                                          icon: () => (
                                              <span aria-label="details">
                                                  <VisibilityIcon />
                                              </span>
                                          ),
                                          onClick: (e, row): void => {
                                              // Somehow the templating system doesn't think row has an id property but it has.
                                              const id = (row as TableRow).id;
                                              this.setState({
                                                  showCaseDetails: true,
                                                  caseDetailsId: id,
                                              });
                                          },
                                          tooltip: 'View this case details',
                                          position: 'row',
                                      },
                                  ]
                                : [
                                      {
                                          icon: () => (
                                              <span aria-label="details">
                                                  <VisibilityIcon />
                                              </span>
                                          ),
                                          onClick: (e, row): void => {
                                              // Somehow the templating system doesn't think row has an id property but it has.
                                              const id = (row as TableRow).id;
                                              this.setState({
                                                  showCaseDetails: true,
                                                  caseDetailsId: id,
                                              });
                                          },
                                          tooltip: 'View this case details',
                                          position: 'row',
                                      },
                                  ]
                        }
                        editable={
                            this.props.user.roles.includes('curator')
                                ? {
                                      onRowDelete: (
                                          rowData: TableRow,
                                      ): Promise<unknown> =>
                                          this.deleteCase(rowData),
                                  }
                                : undefined
                        }
                    />
                </Paper>
            </>
        );
    }
}
