import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: [],
  reducers: {
    setFavorites: (state, action) => action.payload,
    removeFavorite: (state, action) =>
      state.filter((favorite) => favorite.anime?.malId !== action.payload),
  },
});

export const { setFavorites, removeFavorite } = favoritesSlice.actions;

export default favoritesSlice.reducer;

export const favoritesThunk = () => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.USER}/library/favorites`;
  await api
    .get(url)
    .then((res) => dispatch(setFavorites(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
