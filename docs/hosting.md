# Hosting LessonFolk

How the hosted LessonFolk runs, and how to set up or maintain that server. Learners don't need
this page: see [Using LessonFolk](using-lessonfolk.md). It is for whoever runs the server.

## How it works

```
publish a release ─► release.yml: tests ─► build image ─► ghcr.io/cgseb/lessonfolk ─► SSH deploy ─► VPS
                                                                                                  │
                                              Caddy (HTTPS, :443) ─► app (:4321) ─► Postgres ◄── nightly backup
```

- **One VPS** (OVHcloud VPS-1: 2 vCores, 4 GB RAM, 40 GB NVMe, in a European datacenter) runs
  three containers with Docker Compose: **Caddy** (automatic HTTPS), the **app** (dashboard and
  MCP server) and **Postgres**. Only ports 22, 80 and 443 are open. The database has no
  published port.
- **The image** is built and published to the GitHub Container Registry when a release is
  published, as `ghcr.io/cgseb/lessonfolk:latest`, `:<release tag>` (for example `:v1.0.0`) and
  `:sha-<commit>`. Merging to `main` alone deploys nothing. It is public: self-hosters
  pull it with no login, and `docker compose up -d` in this repository uses it.
- **Migrations** are applied by the image's start command, each time the app container starts.
- **Everything the server needs** is in [`deploy/`](../deploy): the Compose file, the Caddyfile,
  `deploy.sh`, `backup.sh` and `restore-test.sh`. The pipeline copies that folder to
  `/opt/lessonfolk` on each deploy, so the server configuration is versioned.

Costs (check the current prices): the VPS is about 5 USD a month; the domain, GHCR, GitHub
Actions (public repository), Let's Encrypt and the uptime check below are free.
OVHcloud's **1-click scaling** moves the server to a bigger plan (VPS-2 has 4 vCores and 8 GB)
with no migration, which is how to grow, for example to run more services next to LessonFolk.

## First-time setup

You do these steps once, and need the accounts yourself.

### 1. The server

1. Order an OVHcloud VPS-1 in a European datacenter, with Ubuntu LTS and your SSH public key.
2. Log in as the default user and create a deploy user, update, and lock down SSH:

   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo adduser --disabled-password deploy
   sudo usermod -aG sudo deploy        # drop this later if you don't need sudo for deploy
   sudo mkdir -p /home/deploy/.ssh
   sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
   sudo chown -R deploy:deploy /home/deploy/.ssh
   ```

   Then disable password login (`PasswordAuthentication no`, `PermitRootLogin no` in
   `/etc/ssh/sshd_config`) and restart `ssh`.
3. Install Docker with the [official apt repository](https://docs.docker.com/engine/install/ubuntu/)
   (Docker Engine and the Compose plugin), and add the deploy user to the `docker` group:

   ```bash
   sudo usermod -aG docker deploy
   ```
4. Turn on the firewall. Docker publishes only Caddy's ports, but keep this as a second layer:

   ```bash
   sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
   sudo ufw enable
   ```
5. Prepare the folder:

   ```bash
   sudo mkdir -p /opt/lessonfolk && sudo chown deploy:deploy /opt/lessonfolk
   ```

### 2. The domain

Point an `A` record (and `AAAA` if the VPS has IPv6) of your domain, for example
`learn.example.com`, at the VPS. Caddy gets the certificate on its own once the record resolves.

### 3. The OAuth apps (production)

Create **separate** apps for production, following [Sign-in for developers](auth-dev.md) with
your real domain instead of `localhost`:

| Provider | Homepage / origin | Callback URL |
|---|---|---|
| GitHub | `https://<domain>` | `https://<domain>/api/auth/callback/github` |
| Google | `https://<domain>` | `https://<domain>/api/auth/callback/google` |

For Google, set the consent screen's audience to **external** and publish the app, otherwise only
the test users you list can sign in.

### 4. The server's `.env`

Copy [`deploy/.env.example`](../deploy/.env.example) to `/opt/lessonfolk/.env` on the server,
fill it in (the file says how to generate each secret) and restrict it:

```bash
chmod 600 /opt/lessonfolk/.env
```

`.env` stays on the server: the pipeline never overwrites it. Set `LESSONFOLK_PRIVACY_CONTACT`
too: the `/privacy` page shows it, and [privacy.md](privacy.md) must be reviewed before learners
are invited.

### 5. The GitHub side

1. **Make the image public.** After the first run of the pipeline, open the package
   `lessonfolk` on GitHub (the repository's **Packages**), then **Package settings** and set its
   visibility to **public**. A package created by a workflow starts private.
2. **Create a deploy key** and keep the private half out of git:

   ```bash
   ssh-keygen -t ed25519 -f lessonfolk-deploy -C "lessonfolk-deploy" -N ""
   ```

   Append `lessonfolk-deploy.pub` to `/home/deploy/.ssh/authorized_keys` on the server.
3. In the repository, create an environment named **`production`** (Settings, Environments),
   optionally with a required reviewer, and add:

   | Kind | Name | Value |
   |---|---|---|
   | Secret | `DEPLOY_HOST` | the server's address |
   | Secret | `DEPLOY_USER` | `deploy` |
   | Secret | `DEPLOY_SSH_KEY` | the content of the private key `lessonfolk-deploy` |
   | Secret | `DEPLOY_KNOWN_HOSTS` | the output of `ssh-keyscan -t ed25519 <host>`, checked against the fingerprint in OVHcloud's panel |
   | Variable | `DEPLOY_URL` | `https://<domain>` (the pipeline waits for it to answer after a deploy) |

   Then delete the local copy of the private key.

Until `DEPLOY_HOST` is set, the pipeline still publishes the image and skips the deploy.

### 6. First deploy and backups

Publish a release (GitHub, **Releases**, **Draft a new release**, a new tag such as `v0.1.0`,
then **Publish release**; pre-releases don't deploy). Check
`https://<domain>`, sign in, and connect claude.ai from the dashboard's **Connect** page.

Then install the nightly backup (as `deploy`, `crontab -e`):

```cron
15 3 * * * /opt/lessonfolk/backup.sh >> /opt/lessonfolk/backups/backup.log 2>&1
```

`backup.sh` writes a compressed `pg_dump` in `/opt/lessonfolk/backups` and deletes dumps older
than 35 days, the retention stated in [privacy.md](privacy.md). **Also copy the dumps off the
server**, so that losing the VPS does not lose the data: install
[rclone](https://rclone.org), configure a remote (an S3-compatible bucket such as OVHcloud
Object Storage, or a Hetzner Storage Box) and set `BACKUP_REMOTE=<remote>:<bucket>/lessonfolk`
in `.env`; the script then uploads each dump and deletes remote ones older than 35 days.
OVHcloud's included daily VPS backup is a second layer, not a replacement.

## Day to day

| Task | How |
|---|---|
| Deploy | Publish a GitHub release with a new tag. Pre-releases and drafts don't deploy. |
| Roll back | On the server: `/opt/lessonfolk/deploy.sh <earlier release tag>`, for example `v0.1.0`. The next release deploys the new version again. |
| Look at logs | `cd /opt/lessonfolk && docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Update Caddy and Postgres images | Each deploy pulls them. Postgres stays on major version 17; a major upgrade is a dump and restore, not a pull. |
| Grow the server | OVHcloud control panel, **1-click scaling**. |

## Backups and the restore test

A backup is only worth something once you have restored it. Run the restore test after setting
up, and again after every change to the backup setup:

```bash
cd /opt/lessonfolk && ./backup.sh && ./restore-test.sh
```

`restore-test.sh` loads the newest dump into a scratch database next to the real one, checks
that tables and users came back, and drops the scratch database. It never touches the live data.

To really restore (for example on a new server): install Docker, copy the `deploy/` folder and
`.env`, start only the database (`docker compose up -d db`), then:

```bash
gunzip -c backups/lessonfolk-<date>.sql.gz | docker compose exec -T db psql -U lessonfolk -d lessonfolk
docker compose up -d
```

Per [privacy.md](privacy.md), a backup is **never restored without deleting again the accounts
deleted since** it was taken.

## Monitoring

- **Uptime:** add a free external check (for example UptimeRobot or Better Stack) on
  `https://<domain>/sign-in` that emails you when it fails.
- **Errors:** read the container logs (above). The pipeline's post-deploy check fails the run
  when the site does not answer after a deploy.
- **Disk:** `df -h` now and then; backups and Docker images are what grow.

## Logs and privacy

Each container's logs are capped at 3 files of 10 MB, which at this size of service holds
well under 30 days; check this when traffic grows. [privacy.md](privacy.md) requires log
retention of at most 30 days and backups of at most 35: don't change the periods there or here
without changing the other.
