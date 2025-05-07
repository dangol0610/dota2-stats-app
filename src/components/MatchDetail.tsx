import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    fetch(`https://api.opendota.com/api/matches/${matchId}`)
      .then((res) => res.json())
      .then((data) => setMatchData(data))
      .catch((err) => console.error("Ошибка загрузки матча:", err));
  }, [matchId]);

  if (!matchData) {
    return <div className="text-white text-center">Загрузка данных матча...</div>;
  }

  // Пример отображения данных
  return (
    <div className="text-white p-4 max-w-screen-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Матч #{matchData.match_id}</h1>

      {/* Таблица команды Radiant */}
      <h2 className="text-green-400 font-semibold mb-2">Силы Света</h2>
      <table className="w-full mb-6 border border-gray-600">
        <thead>
          <tr className="bg-gray-800">
            <th>Игрок</th><th>У</th><th>С</th><th>П</th><th>Нетворс</th><th>Урон</th><th>Предметы</th>
          </tr>
        </thead>
        <tbody>
          {matchData.players
            .filter((p: any) => p.isRadiant)
            .map((player: any, idx: number) => (
              <tr key={idx} className="text-center border-t border-gray-700">
                <td>{player.personaname || "Аноним"}</td>
                <td>{player.kills}</td>
                <td>{player.deaths}</td>
                <td>{player.assists}</td>
                <td>{Math.floor(player.total_gold / 1000)}k</td>
                <td>{Math.floor(player.hero_damage / 1000)}k</td>
                <td>
                  {[player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5]
                    .filter((item) => item !== 0)
                    .map((item, i) => (
                      <img
                        key={i}
                        src={`https://cdn.opendota.com/apps/dota2/images/items/${matchData.item_names[item]}_lg.png`}
                        alt="item"
                        className="inline h-6 mx-1"
                      />
                    ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Аналогичная таблица Dire */}
      <h2 className="text-red-400 font-semibold mb-2">Силы Тьмы</h2>
      <table className="w-full border border-gray-600">
        <thead>
          <tr className="bg-gray-800">
            <th>Игрок</th><th>У</th><th>С</th><th>П</th><th>Нетворс</th><th>Урон</th><th>Предметы</th>
          </tr>
        </thead>
        <tbody>
          {matchData.players
            .filter((p: any) => !p.isRadiant)
            .map((player: any, idx: number) => (
              <tr key={idx} className="text-center border-t border-gray-700">
                <td>{player.personaname || "Аноним"}</td>
                <td>{player.kills}</td>
                <td>{player.deaths}</td>
                <td>{player.assists}</td>
                <td>{Math.floor(player.total_gold / 1000)}k</td>
                <td>{Math.floor(player.hero_damage / 1000)}k</td>
                <td>
                  {[player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5]
                    .filter((item) => item !== 0)
                    .map((item, i) => (
                      <img
                        key={i}
                        src={`https://cdn.opendota.com/apps/dota2/images/items/${matchData.item_names[item]}_lg.png`}
                        alt="item"
                        className="inline h-6 mx-1"
                      />
                    ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
