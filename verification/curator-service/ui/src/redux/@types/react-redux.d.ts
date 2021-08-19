import 'react-redux';

import { AppState } from '../store';

declare module 'react-redux' {
  interface DefaultRootState extends AppState { };
}
