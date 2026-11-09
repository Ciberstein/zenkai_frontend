import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: { data: [], pagination: null },
  reducers: {
    setCatalog: (state, action) => action.payload,
    // El scroll infinito concatena en vez de reemplazar; la paginacion
    // siempre se queda con la de la ultima respuesta.
    appendCatalog: (state, action) => ({
      data: [...state.data, ...action.payload.data],
      pagination: action.payload.pagination,
    }),
  },
});

export const { setCatalog, appendCatalog } = catalogSlice.actions;

export default catalogSlice.reducer;

export const catalogThunk = (filters = {}, { append = false } = {}) => async (dispatch) => {
  if (!append) dispatch(setLoad(false));

  const url = `${API_ROUTES.PUBLIC}/anime`;
  await api
    .get(url, { params: filters })
    .then((res) => dispatch(append ? appendCatalog(res.data) : setCatalog(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
