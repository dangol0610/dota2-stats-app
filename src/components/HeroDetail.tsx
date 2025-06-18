import { useParams, useNavigate, Link } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "../api/opendota";
import { useEffect, useState } from "react";

interface Props {
  accountId: number;
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

interface MatchSummary {
  match_id: number;
  hero_id: number;
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
  gold_per_min: number;
  xp_per_min: number;
}

export function HeroDetail({ accountId }: Props) {
  const { heroId } = useParams<{ heroId: string }>();
  const navigate = useNavigate();

  const { data: heroes } = useSWR<Hero[]>(
    "https://api.opendota.com/api/heroes",
    fetcher
  );

  const { data: items } = useSWR<Record<string, Item>>(
    "https://api.opendota.com/api/constants/items",
    fetcher
  );

  const { data: matchSummaries } = useSWR<MatchSummary[]>(
    accountId && heroId
      ? `https://api.opendota.com/api/players/${accountId}/matches?hero_id=${heroId}&limit=20`
      : null,
    fetcher
  );

  const [detailedMatches, setDetailedMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchSummaries) return;
    if (matchSummaries.length === 0) {
      setDetailedMatches([]);
      setLoading(false);
      return;
    }

    const fetchMatchDetails = async () => {
      setLoading(true);
      const matchesData: MatchDetail[] = [];

      for (const match of matchSummaries) {
        try {
          const res = await fetch(
            `https://api.opendota.com/api/matches/${match.match_id}`
          );
          const fullMatch = await res.json();

          const player = fullMatch.players.find(
            (p: any) => p.account_id === accountId
          );

          if (player) {
            matchesData.push({
              match_id: match.match_id,
              player_slot: player.player_slot,
              radiant_win: fullMatch.radiant_win,
              hero_id: player.hero_id,
              duration: fullMatch.duration,
              kills: player.kills,
              deaths: player.deaths,
              assists: player.assists,
              start_time: fullMatch.start_time,
              item_0: player.item_0,
              item_1: player.item_1,
              item_2: player.item_2,
              item_3: player.item_3,
              item_4: player.item_4,
              item_5: player.item_5,
              gold_per_min: player.gold_per_min,
              xp_per_min: player.xp_per_min,
            });
          }
        } catch (error) {
          console.error("Ошибка загрузки матча:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setDetailedMatches(matchesData);
      setLoading(false);
    };

    fetchMatchDetails();
  }, [matchSummaries, accountId]);

  if (!heroes || !items) return <div className="text-tg_text">Загрузка...</div>;

  const hero = heroes.find((h) => h.id === Number(heroId));
  if (!hero)
    return <div className="text-tg_text">Нет данных по этому герою.</div>;

  const getHeroImageUrl = (name: string) => {
    const shortName = name.replace("npc_dota_hero_", "");
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${shortName}_full.png`;
  };

  const getItemImg = (itemId: number) => {
    if (!items || !itemId) return null;
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

  return (
    <div className="space-y-6 mt-4">
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-[rgba(255,255,255,0.05)] rounded-lg hover:brightness-105 transition text-tg_text"
      >
        ← Назад к героям
      </button>

      <h3 className="text-2xl font-bold text-tg_text mb-4">
        Матчи на {hero.localized_name}
      </h3>

      <div className="space-y-1">
        <div className="hidden sm:grid grid-cols-7 items-center text-tg_hint text-sm px-4 py-2">
          <div className="text-left">Герой</div>
          <div className="text-center">K/D/A</div>
          <div className="text-center">GPM/XPM</div>
          <div className="text-center">Длительность</div>
          <div className="text-center">Когда</div>
          <div className="text-center">Результат</div>
          <div className="text-center">Предметы</div>
        </div>

        {loading ? (
          <div className="text-tg_hint text-center py-8">
            Загрузка матчей...
          </div>
        ) : detailedMatches.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-16">
            <img
              src={getHeroImageUrl(hero.name)}
              alt={hero.localized_name}
              className="absolute opacity-20 w-48 h-48 object-contain rounded-full"
            />
            <div className="relative text-yellow-400 text-xl font-semibold text-center">
              Нет сыгранных матчей на {hero.localized_name}
            </div>
          </div>
        ) : (
          detailedMatches.map((match) => {
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
                  <span className="sm:hidden text-tg_hint mr-1">Длительность:</span>
                  {formatDuration(match.duration)}
                </div>

                <div className="text-sm text-left sm:text-center text-tg_hint">
                  <span className="sm:hidden mr-1">Когда:</span>
                  {timeAgo(match.start_time)}
                </div>

                <div className="text-sm text-left sm:text-center font-bold">
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
                        className="w-7 h-7 rounded border border-[rgba(255,255,255,0.1)]"
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
          })
        )}
      </div>
    </div>
  );
}
