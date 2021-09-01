# aiautoserverchecks

## Install per Docker

1. docker und docker-compos installieren:

    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    apt install python-pip
    pip install docker-compose
    ```

2. Git installieren und Projekt runterladen:

    ```bash
    apt install git
    mdkir -p /op/ai/aiautoserverchecks && cd /op/ai/aiautoserverchecks
    git clone https://github.com/wulv3rin/aiautoserverchecks.git
    ```

3. SSL Zertifikatsstore acme.json für letsencrypt erstellen und Berechtiung berichtigen:

    ```bash
    touch acme.json
    chmod 600 acme.json
    ```

4. Über docker-compose die Container erstellen und ausführen lassen:

    ```bash
    docker-compose up -d
    ```

## Veraltete Installationsanleitung über Ubuntu 18.04

### Reverseproxy

```bash
apt-get install apache2
a2enmod proxy proxy_http proxy_ajp rewrite ssl
vi /etc/apache2/sites-enabled/000-default.conf
        DocumentRoot /opt/ai/aiautoserverchecks/frontend/dist
        Alias /asc /opt/ai/aiautoserverchecks/frontend/dist

        <Directory /opt/ai/aiautoserverchecks/frontend/dist/>
          Options Indexes FollowSymLinks
          AllowOverride None
          Require all granted
        </Directory>

        ProxyPass               /api/ http://localhost:3000/api/
        ProxyPassReverse        /api/ http://localhost:3000/api/
```

### MongoDB

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
mongo
  use aiautoserverchecksdb
  --db.createUser({user: "aiautoservercheckuser", pwd:"init123", roles:[{role:"readWrite", db:"aiautoserverchecksdb"}]})
  db.servers.insertOne({url:"https://demovm.ai-hosting.de/WorkServer/admin", user:"Administraotr", password:"eVergabe2019demo", customer:"0000_DEMO"})
  exit
```

### Nodejs & npm

```bash
sudo apt install -y nodejs npm
```

### Git-Projekt ziehen und Frondend bauen

```bash
cd /opt/ai/
git clone https://github.com/wulv3rin/aiautoserverchecks.git
cd aiautoserverchecks
npm install
cd frontend
npm install
export BackEndHost=localhost 
npm run build
```

### Starten des Backends

```bash
vi /lib/systemd/system/ai-autoservercheck-backend.service
        [Unit]
        Description=main.js - making your environment variables rad
        Documentation=https://github.com/wulv3rin/aiautoserverchecks/
        After=network.target

        [Service]
        Environment=NODE_PORT=3000
        Type=simple
        User=root
        ExecStart=/usr/bin/node /opt/ai/aiautoserverchecks/backend/start.sh
        Restart=on-failure

        [Install]
        WantedBy=multi-user.target

sudo systemctl daemon-reload
sudo systemtl enable hello_env
```
