import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "../api/opendota";

interface Player {
  account_id: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  hero_damage: number;
  last_hits: number;
  denies: number;
  player_slot: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
}

interface Hero {
  id: number;
  name: string;
  localized_name: string;
}

interface Item {
  id: number;
  img: string;
}

export function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState<any>(null);

  const { data: heroes } = useSWR<Hero[]>("https://api.opendota.com/api/heroes", fetcher);
  const { data: items } = useSWR<Record<string, Item>>("https://api.opendota.com/api/constants/items", fetcher);

  useEffect(() => {
    fetch(`https://api.opendota.com/api/matches/${matchId}`)
      .then((res) => res.json())
      .then((data) => setMatchData(data))
      .catch((err) => console.error("Ошибка загрузки матча:", err));
  }, [matchId]);

  const getHero = (id: number) => {
    if (!heroes) return { name: "", localized_name: "Unknown" };
    return heroes.find((h) => h.id === id) ?? { name: "", localized_name: "Unknown" };
  };

  const getHeroImageUrl = (name: string) => {
    const shortName = name.replace("npc_dota_hero_", "");
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${shortName}_full.png`;
  };

  const getItemImg = (itemId: number) => {
    if (!items || itemId === 0) return null;
    const entry = Object.entries(items).find(([, value]) => value.id === itemId);
    return entry ? `https://cdn.cloudflare.steamstatic.com${entry[1].img}` : null;
  };

  // ❗️ Проверка данных
  if (!matchData || !heroes || !items) {
    return <div className="text-white text-center p-4">Загрузка данных матча...</div>;
  }

  // ❗️ Все вычисления ПОД проверкой
  const matchDuration = `${Math.floor(matchData.duration / 60)}m ${matchData.duration % 60}s`;
  const radiantWin = matchData.radiant_win;
  const winnerText = radiantWin ? "Силы Света" : "Силы Тьмы";
  const winnerColor = radiantWin ? "text-green-400" : "text-red-400";

  const renderPlayerCard = (player: Player, index: number) => {
    const hero = getHero(player.hero_id);
    const itemsMain = [
      player.item_0,
      player.item_1,
      player.item_2,
      player.item_3,
      player.item_4,
      player.item_5,
    ];

    return (
      <div
        key={index}
        className="bg-gray-800 text-white px-4 py-3 rounded-xl shadow hover:bg-gray-700 transition flex flex-col sm:grid sm:grid-cols-7 gap-3"
      >
        {/* Герой */}
        <div className="flex items-center gap-3">
          <img
            src={getHeroImageUrl(hero.name)}
            alt={hero.localized_name}
            className="w-10 h-10 rounded"
          />
          <div className="text-sm text-left sm:text-center font-medium">
            {hero.localized_name}
          </div>
        </div>

        {/* K/D/A */}
        <div className="text-sm text-left sm:text-center">
          <span className="sm:hidden text-gray-400 mr-1">K/D/A:</span>
          <span className="text-green-400">{player.kills}</span>/
          <span className="text-red-400">{player.deaths}</span>/
          <span className="text-blue-400">{player.assists}</span>
        </div>

        {/* GPM/XPM */}
        <div className="text-sm text-left sm:text-center">
          <span className="sm:hidden text-gray-400 mr-1">GPM/XPM:</span>
          <span className="text-yellow-400">{player.gold_per_min}</span>/
          <span>{player.xp_per_min}</span>
        </div>

        {/* Урон */}
        <div className="text-sm text-left sm:text-center">
          <span className="sm:hidden text-gray-400 mr-1">Урон:</span>
          {player.hero_damage}
        </div>

        {/* LH/DN */}
        <div className="text-sm text-left sm:text-center">
          <span className="sm:hidden text-gray-400 mr-1">LH/DN:</span>
          {player.last_hits}/{player.denies}
        </div>

        {/* Предметы */}
        <div className="flex flex-wrap gap-1 justify-center">
          {itemsMain.map((id, i) => {
            const src = getItemImg(id);
            return src ? (
              <img
                key={i}
                src={src}
                alt={`item-${id}`}
                className="w-7 h-7 rounded border border-gray-700"
              />
            ) : (
              <div
                key={i}
                className="w-7 h-7 border border-gray-700 bg-gray-700 rounded"
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2 mt-4">
      {/* Информация о матче */}
      <div className="bg-gray-800 rounded-xl shadow p-4 text-center space-y-1">
        <h3 className="text-xl font-semibold text-white">
          Матч #{matchData.match_id}
        </h3>
        <div className="text-gray-400 text-sm">Длительность: {matchDuration}</div>
        <div className={`font-semibold ${winnerColor}`}>
          Победитель: {winnerText}
        </div>
      </div>

      {/* Заголовки таблицы (только на больших экранах) */}
      <div className="hidden sm:grid grid-cols-7 items-center text-gray-400 text-sm px-4 py-2">
        <div className="text-left">Герой</div>
        <div className="text-center">K/D/A</div>
        <div className="text-center">GPM/XPM</div>
        <div className="text-center">Урон</div>
        <div className="text-center">LH/DN</div>
        <div className="text-center">Предметы</div>
      </div>

      {/* Radiant */}
      <h4 className="text-green-400 text-lg font-semibold">Силы Света</h4>
      <div className="space-y-3">
        {matchData.players
          .filter((p: Player) => p.player_slot < 128)
          .map(renderPlayerCard)}
      </div>

      {/* Dire */}
      <h4 className="text-red-400 text-lg font-semibold mt-4">Силы Тьмы</h4>
      <div className="space-y-3">
        {matchData.players
          .filter((p: Player) => p.player_slot >= 128)
          .map(renderPlayerCard)}
      </div>
    </div>
  );
}
