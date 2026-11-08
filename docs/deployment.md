# 部署 / Deployment

`npm run build` 生成纯静态站点 `dist/`，可以放到任何静态托管（Nginx、Cloudflare Pages、Vercel、GitHub Pages）。

## 子路径

```bash
ATLAS_BASE=/words/ npm run build
```

## Nginx 示例

`index.html`、`sw.js` 和 `atlas/index.json` 必须每次回源校验（它们决定加载哪一版带哈希的资源）；只有带哈希的
`assets/`、`atlas/`（图片、音频、分块词条）才可以长期缓存。注意 `atlas/index.json` 要放在 `atlas/` 规则之前，
精确匹配优先。

```nginx
location = /words/index.html {
    alias /var/www/word-atlas/index.html;
    add_header Cache-Control "no-cache";
}
location = /words/sw.js {
    alias /var/www/word-atlas/sw.js;
    add_header Cache-Control "no-cache";
}
location = /words/atlas/index.json {
    alias /var/www/word-atlas/atlas/index.json;
    add_header Cache-Control "no-cache";
}
location ^~ /words/assets/ {
    alias /var/www/word-atlas/assets/;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location ^~ /words/atlas/ {
    alias /var/www/word-atlas/atlas/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
location ^~ /words/ {
    alias /var/www/word-atlas/;
    try_files $uri $uri/ /words/index.html;
    add_header Cache-Control "no-cache";
}
```

## GitHub Pages

仓库带有 `.github/workflows/pages.yml`。在仓库 Settings → Pages 选择 “GitHub Actions”，然后手动运行 “Deploy to GitHub Pages”。

## 体积

插画与音频合计约数百 MB。建议在 CDN 后部署，或按需只发布 `thumb/` 和部分音频。
