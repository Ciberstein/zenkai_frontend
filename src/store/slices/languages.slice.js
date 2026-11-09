import { createSlice } from '@reduxjs/toolkit';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const languagesSlice = createSlice({
  name: 'languages',
  initialState: [],
  reducers: {
    setLanguages: (state, action) => action.payload,
  },
});

export const { setLanguages } = languagesSlice.actions;

export default languagesSlice.reducer;

export const languagesThunk = () => async (dispatch) => {
  const url = `${API_ROUTES.PUBLIC}/app/languages`;
  await api
    .get(url)
    .then((res) => dispatch(setLanguages(res.data)))
    .catch((err) => appError(err));
};
