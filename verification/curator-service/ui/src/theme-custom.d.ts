import { Theme, ThemeOptions } from "@material-ui/core/styles/createMuiTheme";

declare module "@material-ui/core/styles/createMuiTheme" {
  interface Theme {
    custom: {
      palette: {
        button: {
          buttonCaption: string;
        }
      }
    }
  }
  // allow configuration using `createMuiTheme`
  interface ThemeOptions {
    custom?: {
      palette?: {
        button?: {
          buttonCaption?: string;
        }
      }
    }
  }
}