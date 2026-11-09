import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: [],
  reducers: {
    setSchedule: (state, action) => action.payload,
  },
});

export const { setSchedule } = scheduleSlice.actions;

export default scheduleSlice.reducer;

export const scheduleThunk = (day) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.PUBLIC}/catalog/schedules`;
  await api
    .get(url, { params: { day } })
    .then((res) => dispatch(setSchedule(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
