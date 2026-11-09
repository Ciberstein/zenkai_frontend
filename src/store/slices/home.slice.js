import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const homeSlice = createSlice({
  name: 'home',
  initialState: { featured: [], latest: [], now: [], top: [] },
  reducers: {
    setHome: (state, action) => action.payload,
  },
});

export const { setHome } = homeSlice.actions;

export default homeSlice.reducer;

// Un solo thunk para las cuatro filas del inicio: el backend las resuelve en
// paralelo y las sirve cacheadas, asi que no vale la pena partirlo.
export const homeThunk = ({ limit } = {}) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.PUBLIC}/catalog/home`;
  await api
    .get(url, { params: limit ? { limit } : undefined })
    .then((res) => dispatch(setHome(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
