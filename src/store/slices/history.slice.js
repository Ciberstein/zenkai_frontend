import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const historySlice = createSlice({
  name: 'history',
  initialState: { data: [], pagination: null },
  reducers: {
    setHistory: (state, action) => action.payload,
  },
});

export const { setHistory } = historySlice.actions;

export default historySlice.reducer;

export const historyThunk = ({ page = 1 } = {}) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.USER}/history`;
  await api
    .get(url, { params: { page } })
    .then((res) => dispatch(setHistory(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
