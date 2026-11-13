# Guia de despliegue en Ubuntu Server 26.04 LTS

Guia paso a paso para desplegar el proyecto bancario de demostracion con Node.js,
Express, MySQL, Apache, PM2 y HTTPS.

## Datos de esta instalacion

| Elemento | Valor |
|---|---|
| Dominio | `proyectosapp.tech` |
| IPv4 del VPS | `2.25.188.90` |
| Raiz del proyecto | `/var/www/proyectosapp.tech` |
| Base de datos | `simulador_bancario` |
| Usuario MySQL de la aplicacion | `banco_app` |
| Usuario Linux de la aplicacion | `deploy` |
| Puerto interno de Node | `3000` |
| Nombre del proceso PM2 | `simulador-bancario` |

Para otra instalacion, reemplaza el dominio, la IP y la URL del repositorio. Genera
claves nuevas en cada servidor; no copies credenciales de otro entorno.

## Prompt reutilizable

```text
Actua como guia de despliegue para una persona principiante. Ayudame a desplegar
mi aplicacion en un VPS nuevo con Ubuntu Server 26.04 LTS. Responde en espanol y
avanza un paso a la vez: indica los comandos, explica el resultado esperado y
espera mi confirmacion antes del siguiente paso.

La aplicacion usa Node.js/Express, MySQL y un frontend estatico servido por Node.
Quiero Apache como proxy inverso, PM2 para mantener Node activo, PHP instalado
aunque esta aplicacion no lo utilice y Certbot/Let's Encrypt para HTTPS.

Requisitos:
- El repositorio debe quedar directamente en /var/www/MI_DOMINIO/: backend/,
  frontend/ y los otros archivos. No crear una carpeta anidada con el nombre
  del repositorio.
- Ejecutar Node y PM2 con un usuario Linux sin privilegios llamado deploy,
  nunca como root.
- No instalar phpMyAdmin ni ejecutar mysql_secure_installation.
- Crear un usuario MySQL exclusivo para la aplicacion, limitado a su base.
- Generar claves nuevas para MySQL y SESSION_SECRET. No pedirme que las publique
  ni que comparta capturas del archivo .env.
- Advertirme que el SQL inicial puede borrar tablas e importarlo solo una vez.
- Configurar DNS y comprobar que el dominio apunta al VPS antes de solicitar
  el certificado.
- Configurar Apache como proxy a 127.0.0.1:3000, HTTPS, redireccion HTTP a HTTPS
  y comprobar la renovacion automatica del certificado.
- Configurar PM2 para iniciar con Ubuntu y verificar todo despues de reiniciar.
- No ejecutar npm audit fix --force sin revisar los cambios propuestos.

Al final, resume los pasos, las pruebas realizadas y las advertencias pendientes.
```

## Convenciones

- Los comandos de esta guia se ejecutan como `root`, salvo que se indique
  expresamente `deploy`.
- Si usas un usuario administrador en vez de `root`, antepone `sudo` a los
  comandos administrativos.
- No compartas contrasenas, secretos, el contenido de `.env` ni capturas donde
  aparezcan.
- El proyecto es una demostracion. No uses datos personales ni financieros reales.
- El SQL de inicializacion elimina y vuelve a crear las tablas. No lo importes
  otra vez para actualizar el codigo.

## 1. Actualizar Ubuntu y configurar la zona horaria

```bash
apt update
apt upgrade -y
timedatectl set-timezone America/Bogota
timedatectl
```

Usa otra zona horaria si el servidor debe mostrar una hora distinta.

## 2. Instalar software necesario

```bash
apt install -y apache2 mysql-server git nodejs npm php php-cli php-mysql ufw openssl curl
systemctl enable --now apache2 mysql
```

Verifica las versiones:

```bash
node --version
npm --version
git --version
php --version
mysql --version
```

La aplicacion se ejecuta con Node.js. PHP se instala porque fue solicitado, pero
no se necesita `libapache2-mod-php` para servir esta aplicacion.

No instales phpMyAdmin. En este procedimiento tampoco se ejecuta
`mysql_secure_installation`.

## 3. Activar el firewall

Permite SSH y el trafico web antes de activar UFW:

```bash
ufw allow OpenSSH
ufw allow 'Apache Full'
ufw enable
ufw status verbose
```

Si SSH usa un puerto distinto del habitual, permite primero ese puerto especifico.
No abras los puertos MySQL `3306` ni Node `3000` al publico. Si el proveedor del
VPS tiene un firewall adicional, permite tambien SSH, HTTP (80) y HTTPS (443).

## 4. Crear el usuario de Linux y clonar en la ruta final

En un VPS nuevo, crea el usuario sin privilegios:

```bash
adduser --disabled-password --gecos "" deploy
```

Crea la carpeta final y asignasela a `deploy`:

```bash
install -d -o deploy -g deploy /var/www/proyectosapp.tech
```

La carpeta debe estar vacia antes de clonar. Entra como `deploy`:

```bash
su - deploy
```

Clona directamente en la carpeta del dominio para evitar una carpeta anidada:

```bash
git clone https://github.com/Juan130216/proyecto-bancario.git /var/www/proyectosapp.tech
```

Comprueba la estructura:

```bash
ls /var/www/proyectosapp.tech
```

Se deben ver `backend`, `frontend`, `database.sql` y otros archivos del proyecto.
Si el destino ya existe y no esta vacio, detente e inspeccionalo; no lo borres
ni lo sobrescribas sin confirmar su contenido.

## 5. Importar la base de datos una sola vez

Vuelve a `root`:

```bash
exit
```

Importa el SQL de la raiz del proyecto:

```bash
mysql < /var/www/proyectosapp.tech/database.sql
```

Comprueba las tablas:

```bash
mysql -e "SHOW TABLES FROM simulador_bancario;"
```

La base debe contener `usuarios`, `cuentas`, `movimientos` y `transferencias`.
La tabla de usuarios inicialmente contiene cuatro cuentas de demostracion.

El SQL de este proyecto incluye operaciones `DROP TABLE`. Importalo solo al
principio en una base vacia: repetirlo puede borrar los datos existentes.

## 6. Crear el usuario de MySQL para la aplicacion

Genera una nueva contrasena y guardala de forma privada:

```bash
openssl rand -hex 24
```

Abre MySQL:

```bash
mysql
```

En el prompt `mysql>`, reemplaza el marcador por la clave generada:

```sql
CREATE USER 'banco_app'@'localhost' IDENTIFIED BY 'PEGA_AQUI_LA_CLAVE_GENERADA';
GRANT ALL PRIVILEGES ON simulador_bancario.* TO 'banco_app'@'localhost';
EXIT;
```

Si ya existe el usuario porque estas repitiendo una configuracion, no vuelvas a
ejecutar `CREATE USER`. Cambia su clave y conserva los permisos:

```sql
ALTER USER 'banco_app'@'localhost' IDENTIFIED BY 'PEGA_AQUI_LA_NUEVA_CLAVE';
GRANT ALL PRIVILEGES ON simulador_bancario.* TO 'banco_app'@'localhost';
EXIT;
```

## 7. Configurar `.env` e instalar dependencias

Entra como `deploy`, copia la plantilla del proyecto y genera un secreto de
sesion nuevo:

```bash
su - deploy
cd /var/www/proyectosapp.tech/backend
cp .env.example .env
openssl rand -hex 48
nano .env
```

En `nano`, configura las variables. Usa la clave MySQL del paso anterior y el
resultado de `openssl rand -hex 48` como `SESSION_SECRET`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
DB_NAME=simulador_bancario
DB_USER=banco_app
DB_PASSWORD=PEGA_LA_CLAVE_MYSQL
SESSION_SECRET=PEGA_EL_SECRETO_DE_SESION
```

No escribas los textos `PEGA_...`: reemplazalos por los valores generados. Guarda
con **Ctrl+O**, Enter, y sal con **Ctrl+X**.

Instala dependencias como `deploy`:

```bash
npm ci
```

Comprueba que el usuario de la aplicacion puede acceder a la base:

```bash
mysql -u banco_app -p -e "SELECT COUNT(*) FROM simulador_bancario.usuarios;"
```

Cuando pida `Enter password:`, escribe la clave MySQL. No se muestran caracteres
mientras la escribes; es normal.

## 8. Instalar PM2 e iniciar la aplicacion

Instala PM2 globalmente como administrador:

```bash
exit
npm install -g pm2
```

Entra como `deploy` y arranca la app:

```bash
su - deploy
cd /var/www/proyectosapp.tech/backend
pm2 start src/app.js --name simulador-bancario
pm2 status
pm2 logs simulador-bancario --lines 20 --nostream
```

Los logs deben mostrar que la aplicacion se conecto a la base de datos y escucha
en el puerto 3000. Guarda la lista y prepara PM2 para el reinicio del servidor:

```bash
pm2 save
pm2 startup systemd
```

PM2 imprimira un comando administrativo. Vuelve a `root` con `exit` y ejecuta
exactamente el comando que PM2 imprimio. Luego vuelve a `deploy` y guarda otra vez:

```bash
su - deploy
pm2 save
```

No ejecutes la aplicacion como root. Para revisar mas adelante:

```bash
su - deploy
pm2 status
pm2 logs simulador-bancario --lines 20 --nostream
```

## 9. Configurar los DNS del dominio

En el panel del proveedor del dominio:

- Registro tipo `A`, nombre `@`: IPv4 publica del VPS.
- Registro tipo `CNAME`, nombre `www`: dominio principal, por ejemplo
  `proyectosapp.tech`.

Comprueba ambos desde el VPS:

```bash
getent ahostsv4 proyectosapp.tech
getent ahostsv4 www.proyectosapp.tech
```

Los dos deben resolver a la IPv4 del VPS. Espera la propagacion DNS si aun
aparece una IP anterior.

## 10. Configurar Apache como proxy inverso

Como `root`, activa los modulos:

```bash
exit
a2enmod proxy proxy_http
```

Crea el virtual host HTTP:

```bash
nano /etc/apache2/sites-available/proyectosapp.tech.conf
```

Contenido:

```apache
<VirtualHost *:80>
    ServerName proyectosapp.tech
    ServerAlias www.proyectosapp.tech

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog ${APACHE_LOG_DIR}/proyectosapp-error.log
    CustomLog ${APACHE_LOG_DIR}/proyectosapp-access.log combined
</VirtualHost>
```

Guarda y sal de `nano`. Activa el sitio y valida la configuracion:

```bash
a2ensite proyectosapp.tech.conf
apachectl configtest
```

Solo si aparece `Syntax OK`, reinicia Apache:

```bash
systemctl restart apache2
```

Comprueba que `http://proyectosapp.tech` muestra la aplicacion antes de continuar.

## 11. Emitir el certificado SSL

Instala Certbot:

```bash
apt install -y certbot python3-certbot-apache
```

Solicita certificados para el dominio principal y `www`:

```bash
certbot --apache -d proyectosapp.tech -d www.proyectosapp.tech
```

Responde el correo y acepta los terminos. Cuando pregunte si debe redirigir HTTP
a HTTPS, selecciona la opcion de redireccion. Certbot modifica Apache y programa
la renovacion automatica.

Prueba la renovacion:

```bash
certbot renew --dry-run
```

Comprueba en un navegador:

- `https://proyectosapp.tech`
- `https://www.proyectosapp.tech`
- `http://proyectosapp.tech` debe redirigir a HTTPS.

Prueba tambien desde la terminal:

```bash
curl -I http://proyectosapp.tech
curl -I https://proyectosapp.tech
```

La primera respuesta debe ser una redireccion a HTTPS; la segunda debe ser una
respuesta exitosa, normalmente `200`.

Prueba en la aplicacion los accesos de demostracion y los flujos que necesites
(por ejemplo, consulta de saldo, retiro y transferencia). Usa solo datos ficticios.

## 12. Reiniciar y comprobar los servicios

Comprueba si Ubuntu solicita un reinicio:

```bash
if [ -f /var/run/reboot-required ]; then cat /var/run/reboot-required; else echo "No se requiere reinicio"; fi
```

Si hay un kernel pendiente, planifica un reinicio. La web estara fuera de servicio
unos minutos:

```bash
reboot
```

Tras volver a conectarte como `root`, comprueba servicios y PM2:

```bash
systemctl is-active apache2 mysql pm2-deploy
su - deploy -c 'pm2 status'
```

Los servicios deben estar `active` y `simulador-bancario` debe estar `online`.

## 13. Crear una copia de seguridad

Como `root`, crea una copia local de la base:

```bash
mysqldump --single-transaction simulador_bancario > /root/simulador_bancario_$(date +%F_%H%M).sql
ls -lh /root/simulador_bancario_*.sql
```

Una copia almacenada solo en el VPS no protege ante la perdida del servidor.
Para una proteccion real, conserva otra copia fuera del VPS.

## 14. Operacion diaria y actualizaciones

Cerrar PowerShell, VS Code o la terminal no detiene la aplicacion. PM2 la mantiene
ejecutandose y la inicia tras reiniciar Ubuntu.

Si la app esta detenida pero sigue registrada en PM2:

```bash
su - deploy
pm2 restart simulador-bancario
pm2 status
```

Para detenerla temporalmente:

```bash
pm2 stop simulador-bancario
```

Para actualizar el codigo desde GitHub:

```bash
su - deploy
cd /var/www/proyectosapp.tech
git pull
cd backend
npm ci
pm2 restart simulador-bancario
pm2 save
```

No ejecutes el SQL de inicializacion durante una actualizacion normal.

## Advertencias de esta demostracion

- La base incluye cuentas y credenciales de prueba documentadas por el proyecto.
  Cualquier visitante puede modificar los datos ficticios si tiene acceso.
- Las pruebas realizadas cambian los saldos de demostracion.
- En esta instalacion, `npm ci` aviso de cuatro vulnerabilidades moderadas. Se
  pueden revisar con `npm audit`; no ejecutes `npm audit fix --force` sin estudiar
  antes los cambios y probar la aplicacion.
- No uses datos bancarios o personales reales: este proyecto es una demostracion
  universitaria, no un sistema bancario de produccion.
