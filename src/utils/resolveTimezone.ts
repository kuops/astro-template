const warned = new Set<string>();
const valid = new Map<string, boolean>();

/**
 * 返回运行时可识别的 IANA 时区名；无法识别时降级 UTC 并对每个坏值仅告警一次。
 *
 * `dayjs().tz()` 遇到无法识别的时区名会抛 RangeError，导致最先格式化日期的
 * 组件中断整站构建。`site.timezone` 的拼写错误应当降级，而不是打断构建。
 */
export function resolveTimezone(zone: string | undefined): string {
  if (!zone) return "UTC";

  let ok = valid.get(zone);
  if (ok === undefined) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone });
      ok = true;
    } catch {
      ok = false;
    }
    valid.set(zone, ok);
  }
  if (ok) return zone;

  if (!warned.has(zone)) {
    warned.add(zone);
    console.warn(
      `[astro-paper] Unknown timezone "${zone}". Falling back to UTC. ` +
        `Use an IANA name such as "Asia/Shanghai" or "America/New_York".`
    );
  }
  return "UTC";
}
