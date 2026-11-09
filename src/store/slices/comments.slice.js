import { createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { API_ROUTES } from '../../api/routes';

const commentsSlice = createSlice({
  name: 'comments',
  initialState: [],
  reducers: {
    setComments: (state, action) => action.payload,
    addComment: (state, action) => [action.payload, ...state],
    removeComment: (state, action) => state.filter((comment) => comment.id !== action.payload),
  },
});

export const { setComments, addComment, removeComment } = commentsSlice.actions;

export default commentsSlice.reducer;

export const commentsThunk = (malId) => async (dispatch) => {
  const url = `${API_ROUTES.PUBLIC}/anime/${malId}/comments`;
  await api
    .get(url)
    .then((res) => dispatch(setComments(res.data)))
    .catch(() => dispatch(setComments([])));
};
