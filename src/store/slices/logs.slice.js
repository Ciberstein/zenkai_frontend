import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const logsSlice = createSlice({
  name: 'logs',
  initialState: { data: [], pagination: null },
  reducers: {
    setLogs: (state, action) => action.payload,
  },
});

export const { setLogs } = logsSlice.actions;

export default logsSlice.reducer;

export const logsThunk = ({ action: filter, page = 1 } = {}) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.ADMIN}/app/logs`;
  await api
    .get(url, { params: { action: filter, page } })
    .then((res) => dispatch(setLogs(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
