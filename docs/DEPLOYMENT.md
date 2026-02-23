(# Deployment notes)

## Enabling HTTPS for LAN testing (recommended for PWA)

For PWAs and service workers, browsers require a secure context (HTTPS) when accessed via a LAN IP. The simplest robust approaches:

- Use `mkcert` to create locally‑trusted certificates for your LAN IP(s).
- Mount the certs into the container and set the `SSL_KEY_PATH` and `SSL_CERT_PATH` environment variables (see `docker-compose.yml`).

Quick steps (example):

1. Install mkcert (see https://github.com/FiloSottile/mkcert)

2. Generate certs for your host IP and localhost (replace `192.168.100.2` with your machine IP):

```bash
mkcert -install
mkcert 192.168.100.2 localhost 127.0.0.1
```

This will create certificate files like `192.168.100.2+2.pem` and `192.168.100.2+2-key.pem` in the current directory.

3. Move/copy them into `./certs` in the project root (create `certs` if needed).

4. Update `docker-compose.yml` if you used different names, or set the env vars directly in your environment:

```yaml
services:
	app:
		volumes:
			- ./certs:/app/certs:ro
		environment:
			- SSL_KEY_PATH=/app/certs/192.168.100.2+2-key.pem
			- SSL_CERT_PATH=/app/certs/192.168.100.2+2.pem
			- SSL_PORT=5443
			- REDIRECT_HTTP_TO_HTTPS=true
```

5. Rebuild and start:

```bash
docker compose up --build
```

6. Open the HTTPS network URL printed by the server (e.g. `https://192.168.100.2:5443`).

Alternative: use `ngrok` to create a public HTTPS tunnel quickly (no certs needed):

```bash
ngrok http 5000
# then open the https://... URL ngrok provides
```

Security note: do not ship development certs to production. In production, use proper CA-signed certificates or a load balancer/ingress controller that terminates TLS.
