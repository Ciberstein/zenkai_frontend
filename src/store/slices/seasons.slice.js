import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const seasonsSlice = createSlice({
  name: 'seasons',
  initialState: { data: [], pagination: null },
  reducers: {
    setSeason: (state, action) => action.payload,
  },
});

export const { setSeason } = seasonsSlice.actions;

export default seasonsSlice.reducer;

// Sin year/season devuelve la temporada en emision, que es lo que pide la
// pagina al entrar sin filtros.
export const seasonThunk = ({ year, season, page = 1 } = {}) => async (dispatch) => {
  dispatch(setLoad(false));

  const url = year && season
    ? `${API_ROUTES.PUBLIC}/catalog/seasons/${year}/${season}`
    : `${API_ROUTES.PUBLIC}/catalog/seasons/now`;

  await api
    .get(url, { params: { page } })
    .then((res) => dispatch(setSeason(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
