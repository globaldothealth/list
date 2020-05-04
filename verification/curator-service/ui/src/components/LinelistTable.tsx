import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import MaterialTable from 'material-table'
import Paper from '@material-ui/core/Paper';
import React from 'react';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import axios from 'axios';
import { forwardRef } from 'react';

const tableIcons = {
    Add: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ViewColumn {...props} ref={ref} />)
};

interface ListResponse {
    cases: Case[],
    nextPage: number,
    total: number,
}

interface RowProps {
    background: string
    case: Case
}

interface Event {
    name: string;
    dateRange: {
        start: string;
        end: string;
    };
}

interface Demographics {
    sex: string;
}

interface Source {
    url: string;
}

interface Case {
    _id: string;
    importedCase: {
        outcome: string;
    };
    events: Event[];
    demographics: Demographics;
    source: Source;
    notes: string;
}

export default class LinelistTable extends React.Component {

    render() {
        return (
            <Paper>
                <MaterialTable
                    columns={[
                        { title: 'ID', field: '_id' },
                        {
                            title: 'Demographics', field: 'demographics',
                            render: rowData => <span>{rowData.demographics?.sex}</span>,
                        },
                        { title: 'Notes', field: 'notes' },
                        {
                            title: 'Source', field: 'source',
                            render: rowData => <span>{rowData.source?.url}</span>,
                        },
                    ]}

                    data={query =>
                        new Promise((resolve, reject) => {
                            let url = (process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/';
                            url += '?limit=' + query.pageSize;
                            url += '&page=' + (query.page + 1);
                            const response = axios.get<ListResponse>(url);
                            response.then(result => {
                                resolve({
                                    data: result.data.cases,
                                    page: query.page,
                                    totalCount: result.data.total,
                                });
                            }).catch((e) => {
                                reject(e);
                            });
                        })
                    }
                    title="COVID-19 cases"
                    icons={tableIcons}
                    options={{
                        search: false,
                    }}
                />
            </Paper>
        )
    }
}