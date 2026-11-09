import { createSlice } from '@reduxjs/toolkit';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const configSlice = createSlice({
  name: 'config',
  initialState: {},
  reducers: {
    setConfig: (state, action) => action.payload,
  },
});

export const { setConfig } = configSlice.actions;

export default configSlice.reducer;

export const configThunk = () => async (dispatch) => {
  const url = `${API_ROUTES.PUBLIC}/app/config`;
  await api
    .get(url)
    .then((res) => dispatch(setConfig(res.data)))
    .catch((err) => appError(err));
};
