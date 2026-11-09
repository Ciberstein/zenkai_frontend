import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const animeSlice = createSlice({
  name: 'anime',
  initialState: null,
  reducers: {
    setAnime: (state, action) => action.payload,
  },
});

export const { setAnime } = animeSlice.actions;

export default animeSlice.reducer;

export const animeThunk = (malId) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.PUBLIC}/anime/${malId}`;
  await api
    .get(url)
    .then((res) => dispatch(setAnime(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};

// Devuelve los datos en vez de guardarlos: solo los usa la ficha abierta y
// no vale la pena mantener otra rama del store viva entre navegaciones.
export const recommendationsThunk = (malId) => async () => {
  const url = `${API_ROUTES.PUBLIC}/anime/${malId}/recommendations`;
  return await api
    .get(url)
    .then((res) => res.data)
    .catch(() => []);
};
