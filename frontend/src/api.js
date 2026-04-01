import {REACT_APP_API_URL} from './config'

const BASE_URL = REACT_APP_API_URL?.endsWith("/")
  ? REACT_APP_API_URL.slice(0, -1)
  : REACT_APP_API_URL;

export const api = (path) => `${BASE_URL}${path}`;
