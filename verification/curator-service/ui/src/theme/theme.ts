import { createTheme } from '@mui/material/styles';

// to use our custom theme values in typescript we need to define an extension to the DeprecatedThemeOptions type.
declare module '@mui/material/styles' {
    interface Theme {
        custom: {
            palette: {
                button: {
                    buttonCaption: string;
                    customizeButtonColor: string;
                };
                tooltip: {
                    backgroundColor: string;
                    textColor: string;
                };
                appBar: {
                    backgroundColor: string;
                };
                landingPage: {
                    descriptionTextColor: string;
                };
                link: {
                    color: string;
                };
            };
        };
        drawerWidth: number;
    }
    // allow configuration using `createTheme`
    interface ThemeOptions {
        custom?: {
            palette?: {
                button?: {
                    buttonCaption?: string;
                    customizeButtonColor?: string;
                };
                tooltip?: {
                    backgroundColor?: string;
                    textColor?: string;
                };
                appBar?: {
                    backgroundColor?: string;
                };
                landingPage?: {
                    descriptionTextColor?: string;
                };
                link?: {
                    color: string;
                };
            };
        };
        drawerWidth?: number;
    }
}

export const theme = createTheme({
    palette: {
        background: {
            default: '#ecf3f0',
            paper: '#fff',
        },
        primary: {
            main: '#0E7569',
            contrastText: '#fff',
        },
        secondary: {
            main: '#00C6AF',
            contrastText: '#fff',
        },
        error: {
            main: '#FD685B',
            contrastText: '#454545',
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
    },
    shape: {
        borderRadius: 4,
    },
    components: {
        MuiListItem: {
            styleOverrides: {
                root: {
                    color: '#5D5D5D',
                    borderRadius: '4px',
                    '&$selected': {
                        backgroundColor: '#0E75691A',
                        color: '#0E7569',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: '#ECF3F0',
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                colorSecondary: {
                    '&$checked': {
                        color: '#31A497',
                    },
                },
            },
        },
        MuiTablePagination: {
            styleOverrides: {
                root: {
                    border: 'unset',
                    fontFamily: 'Inter',
                    '& .MuiTablePagination-select': {
                        fontFamily: 'Inter',
                    },
                    '&&& .MuiTypography-root': {
                        fontFamily: 'Inter',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    fontFamily: 'Inter',
                    '&&& .MuiTypography-root': {
                        fontFamily: 'Inter',
                    },
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: 'Inter',
                    '&&& .MuiTypography-root': {
                        fontFamily: 'Inter',
                    },
                },
            },
        },
    },
    custom: {
        palette: {
            button: {
                buttonCaption: '#ECF3F0',
                customizeButtonColor: '#ECF3F0',
            },
            tooltip: {
                backgroundColor: '#FEEFC3',
                textColor: 'rgba(0, 0, 0, 0.87)',
            },
            appBar: {
                backgroundColor: '#31A497',
            },
            landingPage: {
                descriptionTextColor: '#838D89',
            },
            link: {
                color: '#5D5D5D',
            },
        },
    },
    drawerWidth: 240,
});
