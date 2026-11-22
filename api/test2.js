module.exports = async (req, res) => {
  const u = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&owner=include&count=40&output=atom";
  const r = await fetch(u, { headers: { "User-Agent": "EdgarBrain mrbeast03459125@gmail.com" } });
  const t = await r.text();
  const n = (t.match(/<entry>/g) || []).length;
  res.status(200).send("STATUS: " + r.status + "\nENTRIES: " + n + "\n\n" + t.slice(0, 700));
};
