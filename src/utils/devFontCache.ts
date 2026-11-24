import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

/** 一年内不重新请求。只作用于开发服务器 */
const IMMUTABLE = "public, max-age=31536000, immutable";
/** 形如 …-eac50eb620c54c10.woff2：Astro 开发时把字体文件内容的哈希写进了文件名 */
const HASHED_FONT_FILE = /-[0-9a-f]{16}\.woff2?(?:\?|$)/;

/**
 * 开发时让浏览器缓存字体文件。
 *
 * Astro 的字体中间件对字体文件一律返回 `Cache-Control: no-store`，于是每次刷新都把页面上
 * 用到的字体重新下载一遍（实测文章页一次 57 个文件、约 1.7MB）。它这么做是为了字体更新后
 * 不用硬刷新；而开发时的字体地址里本来就带内容哈希，内容一变地址就变，所以可以放心强缓存。
 *
 * 做法：和 Astro 的中间件挂在同一路由下，抢在它前面把响应头改掉，文件本身仍由它提供。
 * 只在 astro.config.ts 的 vite.plugins 里挂载，apply 为 serve，不影响构建产物。
 */
export function devFontCache(): Plugin {
  return {
    name: "template:dev-font-cache",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      const base = server.config.base.replace(/\/+$/, "");
      const route = `${base}/${server.config.build.assetsDir}/fonts/`;
      server.middlewares.use(
        route,
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (!HASHED_FONT_FILE.test(req.url ?? "")) {
            return next();
          }
          const setHeader = res.setHeader.bind(res);
          res.setHeader = ((name: string, value: string) => {
            switch (name.toLowerCase()) {
              case "cache-control":
                return setHeader(name, IMMUTABLE);
              case "pragma":
              case "expires":
                return res;
              default:
                return setHeader(name, value);
            }
          }) as ServerResponse["setHeader"];
          next();
        }
      );
    },
  };
}
