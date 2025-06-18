import useSWR from "swr";
import { fetcher } from "../api/opendota";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  accountId: number;
}

interface RecentMatch {
  match_id: number;
  hero_id: number;
  player_slot: number;
  radiant_win: boolean;
}

interface MatchDetail {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  hero_id: number;
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  start_time: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  backpack_0: number;
  backpack_1: number;
  backpack_2: number;
  gold_per_min: number;
  xp_per_min: number;
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

export function MatchList({ accountId }: Props) {
  const { data: recentMatches } = useSWR<RecentMatch[]>(
    `https://api.opendota.com/api/players/${accountId}/recentMatches`,
    fetcher
  );

  const { data: heroes } = useSWR<Hero[]>(
    "https://api.opendota.com/api/heroes",
    fetcher
  );

  const { data: items } = useSWR<Record<string, Item>>(
    "https://api.opendota.com/api/constants/items",
    fetcher
  );

  const [detailedMatches, setDetailedMatches] = useState<MatchDetail[]>([]);

  useEffect(() => {
    if (!Array.isArray(recentMatches)) return;

    const fetchDetails = async () => {
      const matchIds = recentMatches
        .slice(0, 20)
        .map((match) => match.match_id);

      const allMatches = [];

      for (const matchId of matchIds) {
        const res = await fetch(
          `https://api.opendota.com/api/matches/${matchId}`
        );
        const match = await res.json();
        allMatches.push(match);
      }

      const playerMatches = allMatches
        .map((match) => {
          if (!match || !match.players) return null;

          const player = match.players.find(
            (p: any) => p.account_id === accountId
          );

          return player
            ? {
                match_id: match.match_id,
                player_slot: player.player_slot,
                radiant_win: match.radiant_win,
                hero_id: player.hero_id,
                duration: match.duration,
                kills: player.kills,
                deaths: player.deaths,
                assists: player.assists,
                start_time: match.start_time,
                item_0: player.item_0,
                item_1: player.item_1,
                item_2: player.item_2,
                item_3: player.item_3,
                item_4: player.item_4,
                item_5: player.item_5,
                backpack_0: player.backpack_0,
                backpack_1: player.backpack_1,
                backpack_2: player.backpack_2,
                gold_per_min: player.gold_per_min,
                xp_per_min: player.xp_per_min,
              }
            : null;
        })
        .filter(Boolean) as MatchDetail[];

      setDetailedMatches(playerMatches);
    };

    fetchDetails();
  }, [recentMatches, accountId]);

  const getHero = (id: number) => {
    if (!Array.isArray(heroes)) return { name: "", localized_name: "Unknown" };
    return (
      heroes.find((h) => h.id === id) ?? { name: "", localized_name: "Unknown" }
    );
  };

  const getHeroImageUrl = (name: string) => {
    const shortName = name.replace("npc_dota_hero_", "");
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${shortName}_full.png`;
  };

  const getItemImg = (itemId: number) => {
    if (!items || itemId === 0) return null;
    const entry = Object.entries(items).find(
      ([, value]) => value.id === itemId
    );
    if (!entry) return null;
    return `https://cdn.cloudflare.steamstatic.com${entry[1].img}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const timeAgo = (unixSeconds: number) => {
    const seconds = Math.floor(Date.now() / 1000) - unixSeconds;

    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} дн. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    if (mins > 0) return `${mins} мин. назад`;
    return "только что";
  };

  if (!detailedMatches.length) return <div>Загрузка матчей...</div>;

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-xl font-semibold text-tg_text mb-2">
        20 последних матчей
      </h3>

      <div className="hidden sm:grid grid-cols-7 items-center text-tg_hint text-sm px-4 py-2">
        <div className="text-left">Герой</div>
        <div className="text-center">K/D/A</div>
        <div className="text-center">GPM/XPM</div>
        <div className="text-center">Длительность</div>
        <div className="text-center">Когда</div>
        <div className="text-center">Результат</div>
        <div className="text-center">Предметы</div>
      </div>

      <div className="space-y-3">
        {detailedMatches.map((match) => {
          const hero = getHero(match.hero_id);
          const isWin =
            (match.player_slot < 128 && match.radiant_win) ||
            (match.player_slot >= 128 && !match.radiant_win);

          const itemsMain = [
            match.item_0,
            match.item_1,
            match.item_2,
            match.item_3,
            match.item_4,
            match.item_5,
          ];

          return (
            <Link
              key={match.match_id}
              to={`/match/${match.match_id}`}
              className="block bg-tg_card text-tg_text px-4 py-3 rounded-xl shadow hover:brightness-105 transition flex flex-col sm:grid sm:grid-cols-7 gap-3"
            >
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

              <div className="text-sm text-left sm:text-center">
                <span className="sm:hidden text-tg_hint mr-1">K/D/A:</span>
                <span className="text-green-400">{match.kills}</span>/
                <span className="text-red-400">{match.deaths}</span>/
                <span className="text-blue-400">{match.assists}</span>
              </div>

              <div className="text-sm text-left sm:text-center">
                <span className="sm:hidden text-tg_hint mr-1">GPM/XPM:</span>
                <span className="text-yellow-400">{match.gold_per_min}</span>/
                <span>{match.xp_per_min}</span>
              </div>

              <div className="text-sm text-left sm:text-center">
                <span className="sm:hidden text-tg_hint mr-1">
                  Длительность:
                </span>
                {formatDuration(match.duration)}
              </div>

              <div className="text-sm text-left sm:text-center text-tg_hint">
                <span className="sm:hidden mr-1">Когда:</span>
                {timeAgo(match.start_time)}
              </div>

              <div className="text-sm text-left sm:text-center font-bold">
                <span className="sm:hidden text-tg_hint mr-1">Результат:</span>
                <span className={isWin ? "text-green-400" : "text-red-400"}>
                  {isWin ? "Победа" : "Поражение"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 justify-center">
                {itemsMain.map((id, i) => {
                  const src = getItemImg(id);
                  return src ? (
                    <img
                      key={i}
                      src={src}
                      alt={`item-${id}`}
                      className="w-7 h-7 rounded border border-[rgba(255,255,255,0.2)]"
                    />
                  ) : (
                    <div
                      key={i}
                      className="w-7 h-7 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] rounded"
                    />
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
