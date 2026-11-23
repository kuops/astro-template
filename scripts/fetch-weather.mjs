/**
 * 同源天气快照：抓取 sojson（主）→ 失败时用 Open-Meteo（备），
 * 归一化后写入 public/weather.json。
 *
 * 为什么这样做：sojson 的数据端点没有 CORS 头（open/api 虽有 CORS 但校验 UA），
 * 浏览器无法跨域直连；
 * 本项目为纯静态 Astro（无 SSR/运行时代理）。故采用 GitHub 社区通行方案
 * （flat-data / fetch-api-data-action 同类）：构建期 / GitHub Actions 定时把
 * 数据抓成静态 JSON 提交进仓库，页面只读同源 /weather.json —— 零跨域、零运行时服务器。
 *
 * 用法：node scripts/fetch-weather.mjs [cityKey] [cityName]
 * 默认：WEATHER_CITYKEY / WEATHER_CITY 环境变量，或 101210101 / 杭州。
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const cityKey = process.argv[2] ?? process.env.WEATHER_CITYKEY ?? "101210101";
const cityName = process.argv[3] ?? process.env.WEATHER_CITY ?? "杭州";
const province = process.env.WEATHER_PROVINCE ?? "浙江";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const OUT = path.join("public", "weather.json");

const getJSON = async (url, ms = 8000, headers = {}) => {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": UA, ...headers } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(to);
  }
};
const num = s => {
  const m = String(s ?? "").match(/-?\d+(\.\d+)?/);
  return m ? Math.round(Number(m[0])) : null;
};

// 主源：sojson（t.weather.sojson.com），含湿度/空气质量/感冒指数/逐日预报/提醒
async function fromSojson() {
  const j = await getJSON(`http://t.weather.sojson.com/api/weather/city/${cityKey}`);
  const d = j?.data;
  if (j?.status !== 200 || !d) throw new Error("sojson: no data");
  const f = d.forecast?.[0] ?? {};
  return {
    source: "sojson",
    city: (j.cityInfo?.city ?? cityName).replace(/市$/, ""),
    province: j.cityInfo?.parent ?? province,
    temp: num(d.wendu),
    humidity: num(d.shidu),
    weather: f.type ?? "未知",
    windDir: f.fx ?? "",
    windPower: f.fl ?? "",
    min: num(f.low),
    max: num(f.high),
    aqi: f.aqi ?? null,
    quality: d.quality ?? null,
    pm25: d.pm25 ?? null,
    ganmao: d.ganmao ?? "",
    notice: f.notice ?? "",
    sunrise: f.sunrise ?? "",
    sunset: f.sunset ?? "",
    week: f.week ?? "",
    forecast: (d.forecast ?? []).slice(0, 3).map(x => ({
      ymd: x.ymd, week: x.week, type: x.type, high: num(x.high), low: num(x.low), fx: x.fx, fl: x.fl,
    })),
    updateTime: j.cityInfo?.updateTime ?? j.time,
    fetchedAt: new Date().toISOString(),
  };
}

// 备源：Open-Meteo（CORS 开放），WMO code 归一化
const WMO = c =>
  c === 0 ? "晴" : c <= 2 ? "多云" : c === 3 ? "阴" : c <= 48 ? "雾" : c <= 57 ? "毛毛雨" : c <= 67 ? "雨" : c <= 77 ? "雪" : c <= 82 ? "阵雨" : c <= 86 ? "阵雪" : "雷阵雨";
async function fromOpenMeteo() {
  const j = await getJSON(
    "https://api.open-meteo.com/v1/forecast?latitude=30.25&longitude=120.17" +
      "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1"
  );
  const c = j?.current;
  if (!c) throw new Error("open-meteo: no current");
  return {
    source: "open-meteo",
    city: cityName,
    province,
    temp: Math.round(c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m),
    weather: WMO(c.weather_code),
    windDir: "",
    windPower: Math.round(c.wind_speed_10m) + " km/h",
    min: Math.round(j.daily?.temperature_2m_min?.[0] ?? c.temperature_2m),
    max: Math.round(j.daily?.temperature_2m_max?.[0] ?? c.temperature_2m),
    aqi: null,
    quality: null,
    pm25: null,
    ganmao: "",
    notice: "",
    sunrise: "",
    sunset: "",
    week: "",
    forecast: [],
    updateTime: c.time,
    fetchedAt: new Date().toISOString(),
  };
}

let data = null;
for (const [name, fn] of [["sojson", fromSojson], ["open-meteo", fromOpenMeteo]]) {
  try {
    data = await fn();
    console.warn(`fetch-weather: ${name} ok (${data.city} ${data.temp}° ${data.weather})`);
    break;
  } catch (e) {
    console.warn(`fetch-weather: ${name} failed (${e.message})`);
  }
}
if (!data) {
  console.error("fetch-weather: all sources failed; keep existing snapshot");
  process.exit(0); // 不阻断构建
}
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");
console.warn(`fetch-weather: wrote ${OUT}`);