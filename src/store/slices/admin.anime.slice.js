import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const adminAnimeSlice = createSlice({
  name: 'adminAnime',
  initialState: { data: [], pagination: null },
  reducers: {
    setAdminAnime: (state, action) => action.payload,
  },
});

export const { setAdminAnime } = adminAnimeSlice.actions;

export default adminAnimeSlice.reducer;

export const adminAnimeThunk = ({ q, page = 1 } = {}) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.ADMIN}/anime`;
  await api
    .get(url, { params: { q, page } })
    .then((res) => dispatch(setAdminAnime(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};

// Trae el titulo desde Jikan a nuestro catalogo. Devuelve la fila creada para
// que la pantalla pueda navegar directo a sus episodios.
export const syncAnimeThunk = (malId) => async (dispatch) => {
  const url = `${API_ROUTES.ADMIN}/anime/sync/${malId}`;
  return await api
    .post(url)
    .then((res) => {
      dispatch(adminAnimeThunk());
      return res.data;
    })
    .catch((err) => appError(err));
};
