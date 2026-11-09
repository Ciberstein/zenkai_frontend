import { createSlice } from '@reduxjs/toolkit';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const genresSlice = createSlice({
  name: 'genres',
  initialState: [],
  reducers: {
    setGenres: (state, action) => action.payload,
  },
});

export const { setGenres } = genresSlice.actions;

export default genresSlice.reducer;

export const genresThunk = () => async (dispatch) => {
  const url = `${API_ROUTES.PUBLIC}/catalog/genres`;
  await api
    .get(url)
    .then((res) => dispatch(setGenres(res.data)))
    .catch((err) => appError(err));
};
