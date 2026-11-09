import { createSlice } from '@reduxjs/toolkit';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const resumeSlice = createSlice({
  name: 'resume',
  initialState: [],
  reducers: {
    setResume: (state, action) => action.payload,
  },
});

export const { setResume } = resumeSlice.actions;

export default resumeSlice.reducer;

// Fila de "continuar viendo". No toca el loader global: es un extra de la
// home y no debe bloquear el render del resto de las filas.
export const resumeThunk = ({ limit = 12 } = {}) => async (dispatch) => {
  const url = `${API_ROUTES.USER}/history/resume`;
  await api
    .get(url, { params: { limit } })
    .then((res) => dispatch(setResume(res.data)))
    .catch((err) => appError(err));
};
