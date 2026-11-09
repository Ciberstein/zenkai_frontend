import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: { data: [], pagination: null },
  reducers: {
    setAccounts: (state, action) => action.payload,
    updateAccount: (state, action) => ({
      ...state,
      data: state.data.map((account) =>
        account.id === action.payload.id ? { ...account, ...action.payload } : account
      ),
    }),
  },
});

export const { setAccounts, updateAccount } = accountsSlice.actions;

export default accountsSlice.reducer;

export const accountsThunk = ({ q, status, page = 1 } = {}) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.ADMIN}/accounts`;
  await api
    .get(url, { params: { q, status, page } })
    .then((res) => dispatch(setAccounts(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
