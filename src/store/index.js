import { configureStore } from "@reduxjs/toolkit";
import account from "./slices/account.slice";
import accounts from "./slices/accounts.slice";
import adminAnime from "./slices/admin.anime.slice";
import anime from "./slices/anime.slice";
import catalog from "./slices/catalog.slice";
import comments from "./slices/comments.slice";
import config from "./slices/config.slice";
import dark from "./slices/dark.slice";
import episodes from "./slices/episodes.slice";
import favorites from "./slices/favorites.slice";
import genres from "./slices/genres.slice";
import history from "./slices/history.slice";
import home from "./slices/home.slice";
import languages from "./slices/languages.slice";
import loader from "./slices/loader.slice";
import logs from "./slices/logs.slice";
import resume from "./slices/resume.slice";
import schedule from "./slices/schedule.slice";
import seasons from "./slices/seasons.slice";
import settings from "./slices/settings.slice";
import watchlist from "./slices/watchlist.slice";

const store = configureStore({
  reducer: {
    account,
    accounts,
    adminAnime,
    anime,
    catalog,
    comments,
    config,
    dark,
    episodes,
    favorites,
    genres,
    history,
    home,
    languages,
    loader,
    logs,
    resume,
    schedule,
    seasons,
    settings,
    watchlist,
  },
});

export default store;
