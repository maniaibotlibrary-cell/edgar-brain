module.exports = async (req, res) => {
  const r = await fetch("https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&owner=include&count=5&output=atom", { headers: { "User-Agent": "EdgarBrain mrbeast03459125@gmail.com" } });
  const t = await r.text();
  res.status(200).send(r.status + "\n" + t.slice(0, 600));
};
