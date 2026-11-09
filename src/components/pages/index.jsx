// Auth Routes
import { LoginPage as AuthLogin } from "./auth/Login/LoginPage";
import { RegisterPage as AuthRegister } from "./auth/Register/RegisterPage";
import { RecoveryPage as AuthRecovery } from "./auth/Recovery/RecoveryPage";

// User Routes
import { HomePage as UserHome } from "./user/Home/HomePage";
import { CatalogPage as UserCatalog } from "./user/Catalog/CatalogPage";
import { SearchPage as UserSearch } from "./user/Search/SearchPage";
import { SeasonsPage as UserSeasons } from "./user/Seasons/SeasonsPage";
import { SchedulePage as UserSchedule } from "./user/Schedule/SchedulePage";
import { AnimePage as UserAnime } from "./user/Anime/AnimePage";
import { WatchPage as UserWatch } from "./user/Watch/WatchPage";
import { WatchlistPage as UserWatchlist } from "./user/Watchlist/WatchlistPage";
import { FavoritesPage as UserFavorites } from "./user/Favorites/FavoritesPage";
import { HistoryPage as UserHistory } from "./user/History/HistoryPage";
import { ProfilePage as UserProfile } from "./user/Profile/ProfilePage";
import { SettingsPage as UserSettings } from "./user/Settings/SettingsPage";

// Admin Routes
import { HomePage as AdminHome } from "./admin/Home/HomePage";
import { CatalogPage as AdminCatalog } from "./admin/Catalog/CatalogPage";
import { EpisodesPage as AdminEpisodes } from "./admin/Episodes/EpisodesPage";
import { AccountsPage as AdminAccounts } from "./admin/Accounts/AccountsPage";
import { LogsPage as AdminLogs } from "./admin/Logs/LogsPage";
import { JobsPage as AdminJobs } from "./admin/Jobs/JobsPage";
import { SettingsPage as AdminSettings } from "./admin/Settings/SettingsPage";


export const Auth = {
  Pages: {
    Login: AuthLogin,
    Register: AuthRegister,
    Recovery: AuthRecovery,
  }
};

export const User = {
  Pages: {
    Home: UserHome,
    Catalog: UserCatalog,
    Search: UserSearch,
    Seasons: UserSeasons,
    Schedule: UserSchedule,
    Anime: UserAnime,
    Watch: UserWatch,
    Watchlist: UserWatchlist,
    Favorites: UserFavorites,
    History: UserHistory,
    Profile: UserProfile,
    Settings: UserSettings,
  }
};

export const Admin = {
  Pages: {
    Home: AdminHome,
    Catalog: AdminCatalog,
    Episodes: AdminEpisodes,
    Accounts: AdminAccounts,
    Logs: AdminLogs,
    Jobs: AdminJobs,
    Settings: AdminSettings,
  }
};
