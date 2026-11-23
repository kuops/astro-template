/**
 * 同源天气快照：抓取中国天气网（主）→ 失败时用 Open-Meteo（备），
 * 归一化后写入 public/weather.json。
 *
 * 为什么这样做：天气数据端点普遍无 CORS 头（中国天气网还有 Referer 白名单），
 * 浏览器无法跨域直连；本项目为纯静态 Astro（无 SSR/运行时代理）。故采用
 * GitHub 社区通行方案（flat-data / fetch-api-data-action 同类）：构建期把数据
 * 抓成静态 JSON 提交进仓库，页面只读同源 /weather.json —— 零跨域、零运行时服务器。
 *
 * 中国天气网（weather.com.cn，中国气象局官方）接口免 key，但要求
 * Referer 为 weather.com.cn、响应为 JS 变量格式（`var x={...};`），仅适合服务端抓取：
 *   - d1.weather.com.cn/sk_2d/{code}.html          实况（温度/湿度/风/AQI/气压）
 *   - d1.weather.com.cn/weather_index/{code}.html   五日预报(fc) + 生活指数(dataZS) + 预警(alarmDZ)
 * 城市代码为气象局标准代码（101210101=杭州），与 sojson 等第三方同体系。
 *
 * 用法：node scripts/fetch-weather.mjs [cityCode] [cityName] [province]
 * 默认：WEATHER_CITYKEY / WEATHER_CITY / WEATHER_PROVINCE 环境变量，或 101210101 / 杭州 / 浙江。
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
const getText = async (url, ms = 8000, headers = {}) => {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": UA, ...headers } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(to);
  }
};
const num = s => {
  const m = String(s ?? "").match(/-?\d+(\.\d+)?/);
  return m ? Math.round(Number(m[0])) : null;
};

// d1 响应为 `var NAME={json};var NAME2={json}` 的 JS 变量串，按括号配平提取指定变量
const extractVar = (raw, name) => {
  const at = raw.indexOf(`var ${name}`);
  if (at === -1) return null;
  const start = raw.indexOf("{", at);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

// 气象局天气现象代码 → 中文（fc.f[].fa/fb 为白天/夜间代码）
const WX = {
  "00": "晴", "01": "多云", "02": "阴", "03": "阵雨", "04": "雷阵雨", "05": "雷阵雨伴冰雹",
  "06": "雨夹雪", "07": "小雨", "08": "中雨", "09": "大雨", "10": "暴雨", "11": "大暴雨",
  "12": "特大暴雨", "13": "阵雪", "14": "小雪", "15": "中雪", "16": "大雪", "17": "暴雪",
  "18": "雾", "19": "冻雨", "20": "沙尘暴", "21": "小到中雨", "22": "中到大雨",
  "23": "大到暴雨", "24": "暴雨到大暴雨", "25": "大暴雨到特大暴雨", "26": "小到中雪",
  "27": "中到大雪", "28": "大到暴雪", "29": "浮尘", "30": "扬沙", "31": "强沙尘暴", "32": "霾",
};

// 主源：中国天气网 d1（Referer 白名单，服务端设 Referer 即可通过）
// 国内城市：sk_2d 实况 + weather_index 预报/指数齐全；
// 国外城市（40 开头代码）：sk_2d 返回错误页，仅 weather_index 的 fc 五日预报可用，
// 以今日预报近似实况（温度取高低中间值，天气/风取白天段）。
async function fromWeatherCn() {
  const H = { Referer: "http://www.weather.com.cn/" };
  const [skRaw, idxRaw] = await Promise.all([
    getText(`https://d1.weather.com.cn/sk_2d/${cityKey}.html?_=${Date.now()}`, 8000, H),
    getText(`https://d1.weather.com.cn/weather_index/${cityKey}.html?_=${Date.now()}`, 8000, H),
  ]);
  const sk = extractVar(skRaw, "dataSK");
  const fc = extractVar(idxRaw, "fc");
  const zs = extractVar(idxRaw, "dataZS");
  const today = fc?.f?.[0];
  if (!sk?.temp && !today) throw new Error("weather.com.cn: no dataSK/fc");
  const approx = !(sk?.temp != null); // 国外城市：无实况，用今日预报近似
  const aqi = num(sk?.aqi);
  const quality =
    aqi == null
      ? null
      : aqi <= 50 ? "优" : aqi <= 100 ? "良" : aqi <= 150 ? "轻度污染" : aqi <= 200 ? "中度污染" : aqi <= 300 ? "重度污染" : "严重污染";
  const wxOf = c => WX[c] ?? "";
  return {
    source: "weather.com.cn",
    city: sk?.cityname ?? cityName,
    province,
    temp: !approx ? num(sk.temp) : today ? Math.round((num(today.fc) + num(today.fd)) / 2) : null,
    humidity: num(sk?.SD),
    weather: (!approx ? sk.weather : "") || (today ? wxOf(today.fa) : "") || "未知",
    windDir: (!approx ? sk.WD : "") || (today?.fe ?? ""),
    windPower: (!approx ? sk.WS : "") || (today?.fg ?? ""),
    min: today ? num(today.fd) : num(sk?.temp),
    max: today ? num(today.fc) : num(sk?.temp),
    aqi,
    quality,
    pm25: num(sk?.aqi_pm25),
    ganmao: zs?.zs?.gm_des_s ?? "",
    notice: zs?.zs?.ys_des_s ?? "",
    sunrise: "",
    sunset: "",
    week: (sk?.date ?? "").match(/\((.+)\)/)?.[1] ?? (today?.fj ?? ""),
    forecast: (fc?.f ?? []).slice(0, 3).map(x => ({
      ymd: `${new Date().getFullYear()}-${(x.fi ?? "").replace("/", "-")}`,
      week: x.fj ?? "",
      type: x.fa === x.fb ? wxOf(x.fa) : `${wxOf(x.fa)}转${wxOf(x.fb)}`,
      high: num(x.fc), low: num(x.fd), fx: x.fe ?? "", fl: x.fg ?? "",
    })),
    updateTime: sk?.time ?? "",
    fetchedAt: new Date().toISOString(),
  };
}

// Open-Meteo 的 WMO 天气代码 → 中文（备源归一化用）
const WMO = c =>
  c === 0 ? "晴" : c <= 2 ? "多云" : c === 3 ? "阴" : c <= 48 ? "雾" : c <= 57 ? "毛毛雨" : c <= 67 ? "雨" : c <= 77 ? "雪" : c <= 82 ? "阵雨" : c <= 86 ? "阵雪" : "雷阵雨";
// 备源：Open-Meteo（CORS 开放）。坐标按城市名动态解析（不再写死杭州）：
// 国内城市名用 Open-Meteo geocoding；国外城市名 GeoNames 中文别名覆盖差
// （"纽约"查不到、"东京"错命中中国地名），改用 OSM Nominatim（name:zh 覆盖好）。
// 注意：Nominatim 拦截部分机房 IP（本机 403/629），GitHub Actions 等海外 runner 可用；
// 主源已支持国外城市（fc 预报近似），此备源仅作兜底。
const geoResolve = async () => {
  const name = cityName.replace(/市$/, "");
  if (!cityKey.startsWith("40")) {
    const g = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh&format=json`);
    const hit = g?.results?.[0];
    if (hit && typeof hit.latitude === "number") return { lat: hit.latitude, lon: hit.longitude };
    return null;
  }
  const n = await getJSON(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=jsonv2&limit=1&accept-language=zh`);
  const h = n?.[0];
  return h && Number.isFinite(Number(h.lat)) ? { lat: Number(h.lat), lon: Number(h.lon) } : null;
};
async function fromOpenMeteo() {
  const at = await geoResolve();
  if (!at) throw new Error(`open-meteo: cannot geocode ${cityName}`);
  const j = await getJSON(
    "https://api.open-meteo.com/v1/forecast?latitude=" + at.lat + "&longitude=" + at.lon +
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
for (const [name, fn] of [["weather.com.cn", fromWeatherCn], ["open-meteo", fromOpenMeteo]]) {
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
