export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const getRecentMatches = async (accountId: number) => {
  const res = await fetch(
    `https://api.opendota.com/api/players/${accountId}/recentMatches`
  );
  return res.json();
};

export const getHeroes = async () => {
  const res = await fetch("https://api.opendota.com/api/heroes");
  return res.json();
};