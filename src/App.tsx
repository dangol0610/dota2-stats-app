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

function Header({ onSearch }: { onSearch: (id: string) => void }) {
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
        {/* Ряд с навигацией */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
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

        {/* Ряд с формой поиска */}
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
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); // сообщает Telegram, что WebApp загружен
      tg.expand(); // раскрывает WebApp на всю высоту
    }
  }, []);
  const [accountId, setAccountId] = useState<number>(153709817);
  const navigate = useNavigate();

  const handleSearch = (id: string) => {
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      setAccountId(numId);
      navigate("/");
    }
  };

  return (
    <>
      <Header onSearch={handleSearch} />
      <div className="w-full mx-auto p-4 text-white">
        {accountId && (
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
            </Routes>
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="bg-gray-900 min-h-screen">
        <AppContent />
      </div>
    </Router>
  );
}
