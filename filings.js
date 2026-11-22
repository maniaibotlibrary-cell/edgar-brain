// Live SEC EDGAR crawler. IMPORTANT: put YOUR email in UA (SEC requires it).
const UA = "EdgarBrain mrbeast03459125@gmail.com";
const H = { "User-Agent": UA, "Accept-Encoding": "gzip" };

function sector(sic) {
  const s = +sic || 0, p = Math.floor(s / 10);
  if ([1311,1381,1382,1389,2911,2990,5171,5172].includes(s) || (s>=2900&&s<3000)) return "Energy";
  if (s < 1500) return "Materials";
  if (s < 2000) return "Industrials";
  if (s < 2200) return "Consumer Staples";
  if (s < 2400) return "Consumer Discretionary";
  if (s >= 2700 && s < 2800) return "Communication";
  if (s < 2800) return "Materials";
  if (p === 283) return "Health Care";
  if (s < 3000) return "Materials";
  if (s < 3200) return "Consumer Discretionary";
  if (s < 3400) return "Materials";
  if (s >= 3570 && s < 3580) return "Information Technology";
  if (s < 3600) return "Industrials";
  if (s < 3700) return "Information Technology";
  if (s < 3800) return "Consumer Discretionary";
  if (s === 3841 || s === 3842 || s === 3845 || p === 385) return "Health Care";
  if (s < 3900) return "Information Technology";
  if (s < 4000) return "Consumer Discretionary";
  if (s < 4800) return "Industrials";
  if (s < 4900) return "Communication";
  if (s < 5000) return "Utilities";
  if (s === 5122 || p === 514) return "Health Care";
  if (s < 5200) return "Industrials";
  if (p === 541) return "Consumer Staples";
  if (s < 6000) return "Consumer Discretionary";
  if (s >= 6500 && s < 6600 || s === 6798) return "Real Estate";
  if (s < 7000) return "Financials";
  if (s >= 7370 && s < 7380) return "Information Technology";
  if (s >= 8000 && s < 8100) return "Health Care";
  if (s >= 7800 && s < 7900) return "Communication";
  if (s < 7400) return "Industrials";
  return "Consumer Discretionary";
}

async function feed(type) {
  const u = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(type)}&owner=include&count=25&output=atom`;
  const x = await (await fetch(u, { headers: H })).text();
  return [...x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
    const e = m[1];
    const t = (e.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const mm = t.match(/^(\S+)\s+-\s+(.*?)\s+\((\d{10})\)/);
    return mm && {
      form: mm[1], name: mm[2].replace(/&amp;/g, "&"), cik: mm[3],
      url: (e.match(/<link[^>]*href="([^"]+)"/) || [])[1],
      time: (e.match(/<updated>(.*?)<\/updated>/) || [])[1],
    };
  }).filter(Boolean);
}

async function meta(cik) {
  try {
    const j = await (await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: H })).json();
    return { sector: sector(j.sic), ticker: (j.tickers || [])[0] || "" };
  } catch { return { sector: "Industrials", ticker: "" }; }
}

module.exports = async (req, res) => {
  try {
    const all = (await Promise.all([feed("8-K"), feed("10-Q")])).flat();
    const seen = new Set(), rows = [];
    for (const f of all) if (!seen.has(f.cik)) { seen.add(f.cik); rows.push(f); }
    rows.sort((a, b) => b.time.localeCompare(a.time));
    const top = rows.slice(0, 36);
    for (let i = 0; i < top.length; i += 8)
      await Promise.all(top.slice(i, i + 8).map(async f => Object.assign(f, await meta(f.cik))));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    res.status(200).json({ filings: top, at: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: String(e) }); }
};
