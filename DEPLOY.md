# Deployment to VestaCP

One-time server setup, then push to `main` and the GitHub Action does the rest.

## 1. GitHub repository secrets

In the repo *Settings → Secrets and variables → Actions* add:

```
SSH_HOST           = your-server.example.com
SSH_USER           = vestacp-user           # the VestaCP web user that owns the docroot
SSH_PORT           = 22
SSH_PRIVATE_KEY    = -----BEGIN OPENSSH PRIVATE KEY-----  ...
DEPLOY_PATH_API    = /home/<user>/web/<domain>/api        # absolute path on server
DEPLOY_PATH_WEB    = /home/<user>/web/<domain>/public_html
DATABASE_URL       = mysql://natalna:<password>@127.0.0.1:3306/natalna
```

`DEPLOY_PATH_API` does not need to exist before the first run — the action creates it.
The corresponding SSH user must have write access there and `npm`/`pm2` available in
`PATH` (login shell).

## 2. Install the custom nginx template (one-time)

Copy the template files into VestaCP's nginx template directory:

```bash
sudo cp deploy/vestacp/nginx-astro-sim.tpl  /usr/local/vesta/data/templates/web/nginx/
sudo cp deploy/vestacp/nginx-astro-sim.stpl /usr/local/vesta/data/templates/web/nginx/
sudo systemctl restart vesta nginx
```

In the VestaCP panel:

1. Web → edit your domain
2. **Proxy Template**: select `astro-sim`
3. (If SSL enabled) the matching `.stpl` is picked up automatically
4. Save

## 3. Create the MariaDB user/database

```sql
CREATE DATABASE natalna CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'natalna'@'localhost' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON natalna.* TO 'natalna'@'localhost';
FLUSH PRIVILEGES;
```

Use the resulting `mysql://natalna:<password>@127.0.0.1:3306/natalna` as
`DATABASE_URL` in your GitHub secrets.

## 4. Place ephemeris files (one-time)

```bash
mkdir -p $DEPLOY_PATH_API/ephe && cd $DEPLOY_PATH_API/ephe
for f in sepl_18.se1 semo_18.se1 seas_18.se1; do
  curl -sSL -o "$f" "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/$f"
done
```

These are gitignored — they live on the server and stay there across deploys.

## 5. Create `.env.production` on server (one-time)

```bash
cat > $DEPLOY_PATH_API/.env.production <<'EOF'
DATABASE_URL=mysql://natalna:<password>@127.0.0.1:3306/natalna
PORT=3001
HOST=127.0.0.1
EPHE_PATH=./ephe
CORS_ORIGIN=https://your-domain.example.com
NODE_ENV=production
EOF
```

If you change the API port, also update the `proxy_pass` in
`/usr/local/vesta/data/templates/web/nginx/nginx-astro-sim.tpl` (and `.stpl`).

## 6. First pm2 launch (one-time)

```bash
cd $DEPLOY_PATH_API
npm install --omit=dev
npx prisma migrate deploy
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u $USER --hp $HOME    # follow the printed sudo command
```

Subsequent deploys will use `pm2 startOrReload` — no manual restart needed.

## 7. Push to deploy

```bash
git push origin main
```

Watch the Action run; on success the app is live at your domain.

## Troubleshooting

- **`api/meta` returns 502** — check `pm2 logs natalna-api`. Most common cause: missing
  ephemeris files (path or perms).
- **Prisma migration fails** — make sure `DATABASE_URL` on server matches the GitHub secret
  used in CI. The migration runs *on* the server during deploy.
- **404 on subpath under SPA** — verify the `astro-sim` proxy template is the active one
  on the domain in VestaCP. The default Vesta template won't have the SPA fallback.
- **CORS errors from browser** — `CORS_ORIGIN` in `.env.production` must match the exact
  scheme + host you load the web from.
