import { createSlice } from '@reduxjs/toolkit';

const darkSlice = createSlice({
  name: 'dark',
  initialState: localStorage.getItem('dark') !== 'false',
  reducers: {
    setDark: (state, action) => action.payload,
  },
});

export const { setDark } = darkSlice.actions;

export default darkSlice.reducer;

// El tema vive en localStorage y en la clase del <html>, para que el color
// de fondo ya sea el correcto antes de que React pinte.
export const darkThunk = () => (dispatch, getState) => {
  const dark = getState().dark;

  localStorage.setItem('dark', String(dark));
  document.documentElement.classList.toggle('dark', dark);

  dispatch(setDark(dark));
};
