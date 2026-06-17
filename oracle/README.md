# Oracle Free Processor Host

This service is the external processing backend for OpenVerify when the Cloudflare Worker is configured with `PROCESSOR_URL`.

Oracle Cloud Infrastructure's Always Free tier includes Ampere A1 compute instances for the life of the account, in the home region. Oracle Linux also supports container tooling that can run this image without any Cloudflare Containers plan.

References:

- [Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Podman on Oracle Linux](https://docs.oracle.com/en/learn/ol-podman-intro/index.html)

## Recommended Host

- OCI Compute: `VM.Standard.A1.Flex`
- OS: Oracle Linux 9
- Runtime: Podman or Docker-compatible container runtime
- Public port: `8080`

## Build And Run

From a clone of this repository on the VM:

```bash
cd /path/to/OpenVerify
sudo dnf install -y container-tools
podman build -t openverify-processor:latest ./cloudflare/processor
```

Create an env file on the VM, for example `/etc/openverify-processor.env`:

```bash
PROCESSOR_TOKEN=replace-with-a-long-random-secret
PORT=8080
```

Run the service:

```bash
podman run -d \
  --name openverify-processor \
  --restart unless-stopped \
  --env-file /etc/openverify-processor.env \
  -p 8080:8080 \
  openverify-processor:latest
```

Open port `8080` in the OCI security list or network security group for the instance.

## Worker Configuration

Set these values in the Cloudflare Worker environment:

- `PROCESSOR_URL=https://<your-oracle-host>/` or `http://<public-ip>:8080`
- `PROCESSOR_TOKEN=<same-secret-as-the-vm>`

Set `PROCESSOR_TOKEN` as a Wrangler secret, and set `PROCESSOR_URL` as a normal Worker variable:

```bash
wrangler secret put PROCESSOR_TOKEN
```

If you want HTTPS, put a reverse proxy in front of the container and point `PROCESSOR_URL` at the proxy instead of the raw VM port.

## Health Check

```bash
curl -s http://<public-ip>:8080/health
```

The response should report `ok: true` and `authRequired: true` once `PROCESSOR_TOKEN` is set.
