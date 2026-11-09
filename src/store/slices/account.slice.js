import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const accountSlice = createSlice({
  name: 'account',
  initialState: {},
  reducers: {
    setAccount: (state, action) => action.payload,
    setProfile: (state, action) => ({ ...state, profile: action.payload }),
  },
});

export const { setAccount, setProfile } = accountSlice.actions;

export default accountSlice.reducer;

export const accountThunk = () => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.USER}/account`;
  await api
    .get(url)
    .then((res) => dispatch(setAccount(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
