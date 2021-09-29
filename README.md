# aiautoserverchecks

Prüft eingetragene Vergabemanager und Vergabeplatformserver auf hängende Peertask und listet diese auf.  
Autoserverchecks ist in Backend und Frondend aufgeteilt. Das Backend läuft über nodejs und kann als Dienst oder Docker eingerichet werden. Das Frondend ist in vue geschrieben und wird z.B. über apache2 bereitgestellt.  

## Installation per Docker

1. docker und docker-compos installieren:

    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    apt install python-pip
    pip install docker-compose
    ```

1. Git installieren und Projekt runterladen:

    ```bash
    apt install git
    mdkir -p /op/ai/aiautoserverchecks && cd /op/ai/aiautoserverchecks
    git clone https://github.com/wulv3rin/aiautoserverchecks.git
    ```

1. Über docker-compose die Container erstellen und ausführen lassen:

    ```bash
    docker-compose up -d
    ```

1. Anschließend kann die App über den Browser aufgerufen werden: <http://localhost:8082/asc>

## Installationsanleitung ohne Docker

Nachfolge beschrieben, wie man Frontend und Backend lokal auf einen Server einrichtet.  

### Reverseproxy

Apache installieren, Ordner für Frontend festlegen, sowie ProxyPass Regel für Backend definieren:  

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

1. MongoDB installieren und als Service starten:

    ```bash
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
    echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    ```

2. DB anlegen und ein Datensatz anlegen:

    ```bash
    mongo
      use aiautoserverchecksdb
      --db.createUser({user: "aiautoservercheckuser", pwd:"******", roles:[{role:"readWrite", db:"aiautoserverchecksdb"}]})
      db.servers.insertOne({url:"https://demovm.ai-hosting.de/WorkServer/admin", user:"Administraotr", password:"eVergabe2019demo", customer:"0000_DEMO"})
      exit
    ```

### Nodejs & npm

Nodejs baud das das Frondend und fürt das Backend aus und muss somit installiert werden.  

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

### Backends als Dienst einrichten und starten

```bash
vi /lib/systemd/system/ai-autoservercheck-backend.service
        [Unit]
        Description=ASC Backend
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

sudo systemctl enable ai-autoservercheck-backend
sudo systemctl start ai-autoservercheck-backend
```
