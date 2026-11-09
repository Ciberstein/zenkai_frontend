import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import { configThunk } from './config.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: [],
  reducers: {
    setSettings: (state, action) => action.payload,
  },
});

export const { setSettings } = settingsSlice.actions;

export default settingsSlice.reducer;

export const settingsThunk = () => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.ADMIN}/app/config`;
  await api
    .get(url)
    .then((res) => dispatch(setSettings(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};

// Tras guardar se recarga tambien la config publica: es la que alimenta el
// nombre, el icono y los flags que lee toda la interfaz.
export const updateSettingThunk = (id, value) => async (dispatch) => {
  const url = `${API_ROUTES.ADMIN}/app/config/${id}`;
  await api
    .patch(url, { value })
    .then(() => {
      dispatch(settingsThunk());
      dispatch(configThunk());
    })
    .catch((err) => appError(err));
};
