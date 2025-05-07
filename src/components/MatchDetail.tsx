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

  const { data: heroes } = useSWR<Hero[]>(
    "https://api.opendota.com/api/heroes",
    fetcher
  );

  const { data: items } = useSWR<Record<string, Item>>(
    "https://api.opendota.com/api/constants/items",
    fetcher
  );

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
    const isRadiant = player.player_slot < 128;

    const itemsMain = [
      player.item_0,
      player.item_1,
      player.item_2,
      player.item_3,
      player.item_4,
      player.item_5,
    ];

    return (
      <tr key={index} className="border-t border-gray-700 text-center">
        <td className="flex items-center gap-2 py-1">
          <img
            src={getHeroImageUrl(hero.name)}
            alt={hero.localized_name}
            className="w-8 h-8 rounded"
          />
          <span>{hero.localized_name}</span>
        </td>
        <td>{player.kills}/{player.deaths}/{player.assists}</td>
        <td>{player.gold_per_min}/{player.xp_per_min}</td>
        <td>{player.hero_damage}</td>
        <td>{player.last_hits}/{player.denies}</td>
        <td>
          {itemsMain.map((id, i) => {
            const img = getItemImg(id);
            return img ? (
              <img key={i} src={img} alt={`item-${id}`} className="inline-block h-6 mx-0.5" />
            ) : (
              <div key={i} className="inline-block h-6 w-6 bg-gray-700 border border-gray-600 mx-0.5" />
            );
          })}
        </td>
      </tr>
    );
  };

  return (
    <div className="text-white p-4 max-w-screen-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Матч #{matchData.match_id}</h1>

      {/* Radiant */}
      <h2 className="text-green-400 font-semibold mb-2">Силы Света</h2>
      <table className="w-full text-sm mb-6 border border-gray-600">
        <thead>
          <tr className="bg-gray-800">
            <th className="text-left px-2">Герой</th>
            <th>K/D/A</th>
            <th>GPM/XPM</th>
            <th>Урон</th>
            <th>LH/DN</th>
            <th>Предметы</th>
          </tr>
        </thead>
        <tbody>
          {matchData.players
            .filter((p: Player) => p.player_slot < 128)
            .map(renderPlayerRow)}
        </tbody>
      </table>

      {/* Dire */}
      <h2 className="text-red-400 font-semibold mb-2">Силы Тьмы</h2>
      <table className="w-full text-sm border border-gray-600">
        <thead>
          <tr className="bg-gray-800">
            <th className="text-left px-2">Герой</th>
            <th>K/D/A</th>
            <th>GPM/XPM</th>
            <th>Урон</th>
            <th>LH/DN</th>
            <th>Предметы</th>
          </tr>
        </thead>
        <tbody>
          {matchData.players
            .filter((p: Player) => p.player_slot >= 128)
            .map(renderPlayerRow)}
        </tbody>
      </table>
    </div>
  );
}
