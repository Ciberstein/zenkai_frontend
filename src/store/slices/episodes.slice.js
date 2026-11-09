import { createSlice } from '@reduxjs/toolkit';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const episodesSlice = createSlice({
  name: 'episodes',
  initialState: [],
  reducers: {
    setEpisodes: (state, action) => action.payload,
  },
});

export const { setEpisodes } = episodesSlice.actions;

export default episodesSlice.reducer;

export const episodesThunk = (malId) => async (dispatch) => {
  const url = `${API_ROUTES.PUBLIC}/anime/${malId}/episodes`;
  await api
    .get(url)
    .then((res) => dispatch(setEpisodes(res.data)))
    // Un titulo sin sincronizar responde 404: la ficha se sigue mostrando,
    // solo que sin lista de episodios reproducibles.
    .catch(() => dispatch(setEpisodes([])));
};

export const episodeThunk = (malId, number) => async () => {
  const url = `${API_ROUTES.PUBLIC}/anime/${malId}/episodes/${number}`;
  return await api
    .get(url)
    .then((res) => res.data)
    .catch((err) => appError(err));
};
