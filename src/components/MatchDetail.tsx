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

  if (!matchData || !heroes || !items) {
    return <div className="text-white text-center p-4">Загрузка данных матча...</div>;
  }

  const renderPlayerRow = (player: Player, index: number) => {
    const hero = getHero(player.hero_id);
    const itemsMain = [
      player.item_0, player.item_1, player.item_2,
      player.item_3, player.item_4, player.item_5,
    ];

    return (
      <div
        key={index}
        className="bg-gray-800 rounded-lg shadow p-3 flex flex-col sm:grid sm:grid-cols-7 gap-2 items-center"
      >
        {/* Герой */}
        <div className="flex items-center gap-2">
          <img src={getHeroImageUrl(hero.name)} alt={hero.localized_name} className="w-10 h-10 rounded" />
          <span className="text-sm font-medium">{hero.localized_name}</span>
        </div>

        {/* K/D/A */}
        <div className="text-sm text-center">
          <span className="text-green-400">{player.kills}</span>/
          <span className="text-red-400">{player.deaths}</span>/
          <span className="text-blue-400">{player.assists}</span>
        </div>

        {/* GPM/XPM */}
        <div className="text-sm text-center text-yellow-300">
          {player.gold_per_min}/{player.xp_per_min}
        </div>

        {/* Урон */}
        <div className="text-sm text-center">{player.hero_damage}</div>

        {/* LH/DN */}
        <div className="text-sm text-center">{player.last_hits}/{player.denies}</div>

        {/* Предметы */}
        <div className="flex flex-wrap justify-center gap-1">
          {itemsMain.map((id, i) => {
            const img = getItemImg(id);
            return img ? (
              <img key={i} src={img} alt={`item-${id}`} className="h-7 w-7 rounded border border-gray-700" />
            ) : (
              <div key={i} className="h-7 w-7 rounded border border-gray-700 bg-gray-700" />
            );
          })}
        </div>

      </div>
    );
  };

  return (
    <div className="text-white p-4 max-w-screen-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-yellow-400 text-center mb-4">
        Матч #{matchData.match_id}
      </h1>

      {/* Radiant */}
      <div>
        <h2 className="text-green-400 text-lg font-semibold mb-2">Силы Света</h2>
        <div className="space-y-2">
          {matchData.players.filter((p: Player) => p.player_slot < 128).map(renderPlayerRow)}
        </div>
      </div>

      {/* Dire */}
      <div>
        <h2 className="text-red-400 text-lg font-semibold mb-2">Силы Тьмы</h2>
        <div className="space-y-2">
          {matchData.players.filter((p: Player) => p.player_slot >= 128).map(renderPlayerRow)}
        </div>
      </div>
    </div>
  );
}
