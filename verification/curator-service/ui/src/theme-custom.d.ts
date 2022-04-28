import { Theme, DeprecatedThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles/createMuiTheme' {
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
            };
        };
    }
    // allow configuration using `createMuiTheme`
    interface DeprecatedThemeOptions {
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
            };
        };
    }
}
