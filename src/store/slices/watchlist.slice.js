import { createSlice } from '@reduxjs/toolkit';
import { setLoad } from './loader.slice';
import appError from '../../utils/appError';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState: { data: [], pagination: null },
  reducers: {
    setWatchlist: (state, action) => action.payload,
    removeFromWatchlist: (state, action) => ({
      ...state,
      data: state.data.filter((entry) => entry.anime?.malId !== action.payload),
    }),
  },
});

export const { setWatchlist, removeFromWatchlist } = watchlistSlice.actions;

export default watchlistSlice.reducer;

export const watchlistThunk = ({ status, page = 1 } = {}) => async (dispatch) => {
  dispatch(setLoad(false));
  const url = `${API_ROUTES.USER}/library/watchlist`;
  await api
    .get(url, { params: { status, page } })
    .then((res) => dispatch(setWatchlist(res.data)))
    .catch((err) => appError(err))
    .finally(() => dispatch(setLoad(true)));
};
