import useSWR from "swr";
import { fetcher } from "../api/opendota";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  accountId: number;
}

interface Hero {
  id: number;
  name: string;
  localized_name: string;
}

interface HeroStats {
  hero_id: number;
  games: number;
  win: number;
}

export function HeroStats({ accountId }: Props) {
  const { data: heroes } = useSWR<Hero[]>(
    "https://api.opendota.com/api/heroes",
    fetcher
  );

  const { data: heroStats } = useSWR<HeroStats[]>(
    `https://api.opendota.com/api/players/${accountId}/heroes`,
    fetcher
  );

  const [sortKey, setSortKey] = useState<"games" | "winrate" | "win" | "lose">(
    "games"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [onlyTenPlus, setOnlyTenPlus] = useState(false);

  if (!Array.isArray(heroes) || !Array.isArray(heroStats)) {
    return <div>Загрузка статистики...</div>;
  }

  const heroMap = new Map<number, Hero>();
  heroes.forEach((h) => heroMap.set(h.id, h));

  let sortedStats = [...heroStats]
    .filter((h) => heroMap.has(h.hero_id))
    .map((h) => ({
      ...h,
      name: heroMap.get(h.hero_id)?.localized_name || "Unknown",
      img: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${heroMap
        .get(h.hero_id)
        ?.name.replace("npc_dota_hero_", "")}_full.png`,
      winrate: h.games > 0 ? (h.win / h.games) * 100 : 0,
      lose: h.games - h.win,
    }));

  if (onlyTenPlus) {
    sortedStats = sortedStats.filter((hero) => hero.games >= 10);
  }

  sortedStats = sortedStats.sort((a, b) => {
    if (sortKey === "games") {
      return sortOrder === "asc" ? a.games - b.games : b.games - a.games;
    } else if (sortKey === "winrate") {
      return sortOrder === "asc"
        ? a.winrate - b.winrate
        : b.winrate - a.winrate;
    } else if (sortKey === "win") {
      return sortOrder === "asc" ? a.win - b.win : b.win - a.win;
    } else if (sortKey === "lose") {
      return sortOrder === "asc" ? a.lose - b.lose : b.lose - a.lose;
    }
    return 0;
  });

  const toggleSort = (key: "games" | "winrate" | "win" | "lose") => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="w-full bg-gray-800 text-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Статистика по героям</h2>

        {/* Фильтр */}
        <button
          onClick={() => setOnlyTenPlus((prev) => !prev)}
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
        >
          {onlyTenPlus ? "Показать всех" : "Только 10+ игр"}
        </button>
      </div>

      {/* TABLE-VIEW для десктопов */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="text-left bg-gray-700">
              <th className="p-2">Герой</th>
              <th
                className="p-2 cursor-pointer"
                onClick={() => toggleSort("games")}
              >
                Игры{" "}
                {sortKey === "games" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="p-2 cursor-pointer"
                onClick={() => toggleSort("win")}
              >
                Победы{" "}
                {sortKey === "win" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="p-2 cursor-pointer"
                onClick={() => toggleSort("lose")}
              >
                Поражения{" "}
                {sortKey === "lose" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="p-2 cursor-pointer"
                onClick={() => toggleSort("winrate")}
              >
                Винрейт{" "}
                {sortKey === "winrate" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedStats.map((hero) => (
              <tr
                key={hero.hero_id}
                className="border-b border-gray-700 hover:bg-gray-700"
              >
                <td className="p-2 flex items-center gap-3">
                  <Link
                    to={`/hero/${hero.hero_id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <img
                      src={hero.img}
                      alt={hero.name}
                      className="w-10 h-10 rounded-md"
                    />
                    {hero.name}
                  </Link>
                </td>
                <td className="p-2">{hero.games}</td>
                <td className="p-2 text-green-400">{hero.win}</td>
                <td className="p-2 text-red-400">{hero.lose}</td>
                <td className="p-2">{hero.winrate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Мобильная сортировка */}
      <div className="block sm:hidden mb-4">
        <label className="block text-sm font-medium mb-1 text-white">
          Сортировка:
        </label>
        <select
          value={sortKey}
          onChange={(e) => {
            const key = e.target.value as "games" | "winrate" | "win" | "lose";
            toggleSort(key);
          }}
          className="bg-gray-700 text-white p-2 rounded w-full"
        >
          <option value="games">Игры</option>
          <option value="win">Победы</option>
          <option value="lose">Поражения</option>
          <option value="winrate">Винрейт</option>
        </select>
      </div>
      {/* CARD-VIEW для мобильных */}
      <div className="block sm:hidden space-y-3 mt-4">
        {sortedStats.map((hero) => (
          <Link
            key={hero.hero_id}
            className="bg-gray-700 rounded-xl p-4 shadow flex flex-col gap-2"
            to={`/hero/${hero.hero_id}`}
          >
            <div className="flex items-center gap-4">
              <img
                src={hero.img}
                alt={hero.name}
                className="w-10 h-10 rounded-md"
              />

              {hero.name}
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Игры: </span>
              <span>{hero.games}</span>
            </div>
            <div className="text-sm text-green-400">
              <span className="text-gray-400 text-white">Победы: </span>
              <span>{hero.win}</span>
            </div>
            <div className="text-sm text-red-400">
              <span className="text-gray-400 text-white">Поражения: </span>
              <span>{hero.lose}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Винрейт: </span>
              <span>{hero.winrate.toFixed(2)}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
