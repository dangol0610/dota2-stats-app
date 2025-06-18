import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import { PlayerProfile } from "./components/PlayerProfile";
import { MatchList } from "./components/MatchList";
import { HeroStats } from "./components/HeroStats";
import { HeroDetail } from "./components/HeroDetail";
import { MatchDetail } from "./components/MatchDetail";

function Header({
  onSearch,
  showReturnButton,
  onReturn,
}: {
  onSearch: (id: string) => void;
  showReturnButton?: boolean;
  onReturn?: () => void;
}) {
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setSearchValue("");
    }
  };

  return (
    <div className="bg-gray-900 py-4 px-4 sm:px-8 shadow w-full">
      <div className="max-w-screen-xl mx-auto w-full flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          {showReturnButton && onReturn && (
            <button
              onClick={onReturn}
              className="p-1 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition"
              title="Вернуться в свой профиль"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-yellow-400 font-semibold"
                : "text-gray-400 hover:text-white transition"
            }
          >
            Матчи
          </NavLink>
          <NavLink
            to="/heroes"
            className={({ isActive }) =>
              isActive
                ? "text-yellow-300 font-semibold"
                : "text-gray-300 hover:text-white transition"
            }
          >
            Герои
          </NavLink>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full sm:w-auto items-center bg-gray-700 rounded-md overflow-hidden"
        >
          <button
            type="submit"
            className="pl-3 pr-2 text-gray-400 hover:text-white focus:outline-none"
            title="Поиск"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
              />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Поиск по ID..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const [accountId, setAccountId] = useState<number | null>(null);
  const [linkedAccountId, setLinkedAccountId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const theme = tg.themeParams;
      console.log("🎨 Тема Telegram:", theme);
      const root = document.documentElement;
      if (theme?.bg_color) root.style.setProperty('--tg-bg-color', theme.bg_color);
      if (theme?.text_color) root.style.setProperty('--tg-text-color', theme.text_color);
      if (theme?.hint_color) root.style.setProperty('--tg-hint-color', theme.hint_color);

      const telegramId = tg.initDataUnsafe?.user?.id;
      console.log("🟢 telegramId на фронтенде:", telegramId);
      if (telegramId) {
        fetch(
          `https://dota2-stats-app-backend.onrender.com/getAccountId?telegramId=${telegramId}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.accountId) {
              console.log("✅ Привязанный accountId найден:", data.accountId);
              setLinkedAccountId(Number(data.accountId));
              setAccountId(Number(data.accountId));
            } else {
              console.log("❌ Привязки нет, используется дефолтный.");
              setAccountId(null);
            }
          })
          .catch((err) => {
            console.error("Ошибка запроса:", err);
            setAccountId(null);
          });
      } else {
        console.log("❌ Telegram ID не найден → fallback");
        setAccountId(null);
      }
    } else {
      console.log("❌ WebApp API не найден → fallback");
      setAccountId(null);
    }
  }, []);

  const handleSearch = (id: string) => {
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      setAccountId(numId);
      navigate("/");
    }
  };

  return (
    <>
      <Header
        onSearch={handleSearch}
        showReturnButton={
          linkedAccountId !== null && accountId !== linkedAccountId
        }
        onReturn={() => setAccountId(linkedAccountId)}
      />
      <div className="w-full mx-auto p-4 text-tg_text">
        {accountId !== null && (
          <>
            <PlayerProfile accountId={accountId} />
            <div className="mt-6" />
            <Routes>
              <Route path="/" element={<MatchList accountId={accountId} />} />
              <Route
                path="/heroes"
                element={<HeroStats accountId={accountId} />}
              />
              <Route
                path="/hero/:heroId"
                element={<HeroDetail accountId={accountId} />}
              />
              <Route path="/match/:matchId" element={<MatchDetail />} />
            </Routes>
          </>
        )}
        {accountId === null && (
          <div className="text-center text-yellow-400 text-lg mt-8">
            Загрузка данных профиля...
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="bg-tg_bg min-h-screen">
        <AppContent />
      </div>
    </Router>
  );
}
