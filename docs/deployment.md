# 部署 / Deployment

`npm run build` 生成纯静态站点 `dist/`，可以放到任何静态托管（Nginx、Cloudflare Pages、Vercel、GitHub Pages）。

## 子路径

```bash
ATLAS_BASE=/words/ npm run build
```

## Nginx 示例

```nginx
location ^~ /words/ {
    alias /var/www/word-atlas/;
    try_files $uri $uri/ /words/index.html;

    # 带内容哈希的构建产物与媒体文件可以长期缓存
    location ~ ^/words/(assets/|atlas/(audio|img|thumb)/) {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 入口页面、Service Worker 与词条索引每次部署都会变化，必须回源校验
    location ~ ^/words/(index\.html|sw\.js|atlas/index\.json)$ {
        expires off;
        add_header Cache-Control "no-cache";
    }

    expires 7d;
}
```

入口文件与 `atlas/index.json` 不能长期缓存：重新部署后，浏览器仍会使用旧的 `index.html`，它指向的带哈希资源已被删除，页面就打不开了。只有带内容哈希的 `/assets/*` 适合 `immutable` 长缓存；其余文件按需调整。

## GitHub Pages

仓库带有 `.github/workflows/pages.yml`。在仓库 Settings → Pages 选择 “GitHub Actions”，然后手动运行 “Deploy to GitHub Pages”。

## 体积

插画与音频合计约数百 MB。建议在 CDN 后部署，或按需只发布 `thumb/` 和部分音频。
