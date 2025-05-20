import useSWR from "swr";
import { fetcher } from "../api/opendota";

interface Props {
  accountId: number;
}

export function PlayerProfile({ accountId }: Props) {
  const { data: player, error: playerError } = useSWR(
    `https://api.opendota.com/api/players/${accountId}`,
    fetcher
  );

  const { data: wl, error: wlError } = useSWR(
    `https://api.opendota.com/api/players/${accountId}/wl`,
    fetcher
  );

  if (playerError || wlError)
    return <div className="text-red-500">Ошибка загрузки профиля</div>;
  if (!player || !wl) return <div>Загрузка профиля...</div>;

  const getRankName = (rank_tier: number) => {
    const rank = Math.floor(rank_tier / 10);
    const star = rank_tier % 10;

    const rankNames = [
      "Herald",
      "Guardian",
      "Crusader",
      "Archon",
      "Legend",
      "Ancient",
      "Divine",
      "Immortal",
    ];

    if (rank >= 1 && rank <= 7) {
      return `${rankNames[rank - 1]} ${star}`;
    } else if (rank === 8) {
      return "Immortal";
    } else {
      return "Unknown";
    }
  };

  const winrate =
    wl.win + wl.lose > 0
      ? ((wl.win / (wl.win + wl.lose)) * 100).toFixed(2)
      : "N/A";
  return (
    <div className="w-full bg-gray-800 text-white px-6 py-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
        <div className="relative shrink-0">
          <img
            src={player.profile?.avatarfull}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 w-full">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {player.profile?.personaname}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 text-base sm:text-lg mt-1">
            <div>
              <span className="text-gray-400">Победы: </span>
              <span className="text-green-400 font-semibold">
                {wl.win ?? "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Поражения: </span>
              <span className="text-red-400 font-semibold">
                {wl.lose ?? "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Доля побед: </span>
              <span className="font-semibold">{winrate}%</span>
            </div>
          </div>
        </div>
      </div>
      {player.rank_tier &&
        (() => {
          const rank = Math.floor(player.rank_tier / 10);
          const star = player.rank_tier % 10;

          let rankIconName = `rank${rank}`;
          if (rank === 8) {
            if (star >= 3) {
              rankIconName = "rank8c";
            } else if (star === 2) {
              rankIconName = "rank8b";
            } else {
              rankIconName = "rank8";
            }
          }

          return (
            <div className="flex flex-col items-center gap-2">
              <img
                src={`https://courier.spectral.gg/images/dota/ranks/${rankIconName}.png`}
                alt="Rank Icon"
                className="w-20 h-20 sm:w-24 sm:h-24"
              />
              <span className="text-lg">{getRankName(player.rank_tier)}</span>
            </div>
          );
        })()}
    </div>
  );
}
