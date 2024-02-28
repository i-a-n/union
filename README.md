# union

union is a nodejs web server created to serve multiple domains from a single host machine. it was originally developed to replace simple nginx/apache setups with express. some important features are:

- written in node, so it can be installed & run using `npm`
- can be called with no configuration in a traditional `/var/www/vhosts`-style directory, and will serve each domain it finds there
- uses express as its web server, so optional per-domain configurations can be written just like normal express apps
- uses pm2 to manage a daemon, so the server will restart if it crashes, and can run forever by default
- serves https with minimal configuration
- can serve single domains too
- includes instructions for auto-starting the server when the machine boots, opening port :80/:443, and more

union combines the ease & lightweight config of a modern express server with the sturdiness and standard multi-domain capabilities of a traditional httpd server. you might even call it a _union_ of the two approaches.

## examples

<details open="true">
<summary>
static, quickstart example
</summary>

let's say you have a traditional `/var/www/vhosts` directory, and it looks like this:

```
├── alpha.com
│   └── html
│       └── index.html
├── bravo.com
│   └── index.html
└── charlie.com
    └── index.html
```

run the following:

1. `npm init`
2. `npm install @i-a-n/union`
3. `npx union`

running these three commands in your `/var/www/vhosts` directory is all you need to do. union will detect the three directories that look like domain names, and serve them as three separate domains with their own document roots by default. it will also handle the case where an `html/` directory is present and serve that instead (like in the `alpha.com` example above).

</details>

<details>
<summary>per-domain config example</summary>

let's say you have a structure that looks like this:

```
├── alpha.com
│   ├── app
│   │   ├── index.html
│   │   └── compiled-index.js
│   └── src
│       └── App.tsx
├── bravo.com
│   ├── index.html
│   └── private
│       └── secret.key
└── charlie.com
    └── index.html
```

in this example you might want to serve `alpha.com` from its `./app` directory, as a single page app. you might also want to NOT serve `bravo.com/private`. and you might want to make `charlie.com` password-protected. this is how you'd do that:

```diff
 ├── alpha.com
+│   ├── .union.config.js
 │   ├── app
 │   │   ├── index.html
 │   │   └── compiled-index.js
 │   └── src
 │       └── App.tsx
 ├── bravo.com
 │   ├── index.html
 │   └── private
+│       ├── .do-not-serve
 │       └── secret.key
 └── charlie.com
+│       ├── .union-password
         └── index.html
```

1. add a `.union.config.js` file in the root of the domain you want to use a special config for. union will automatically find that file and use that to serve the domain name it's in. for a single-page app, here's an example of the config file you could use (which just creates an express server):

```
// include express
const express = require('express');

// then configure an express app like usual
const path = require('path');
const app = express();

// Serve static files from the app directory
app.use(express.static(path.join(__dirname, 'app')));

// standard "catchall" handler for single-page apps
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// export your express server. union will know what to do with it.
module.exports = app;
```

2. putting a blank `.do-not-serve` file in a directory will keep union from serving that entire directory

```
$ touch bravo.com/private/.do-not-serve
```

3. putting a plaintext file named `.union-password` in a directory will make that directory password-protected. it's kind of a shortcut for traditional `.htaccess`/`.htpasswd` files in other httpd servers. a `.union-password` file looks like this:

```
someuser:somepassword
otheruser:otherpassword
```

</details>

<details>
<summary>ssl example</summary>

union can serve https traffic when certiticates are provided in a standard way. first, make a sibling directory to your domains folders and call it `certificates`:

```diff
 ├── alpha.com
 │   └── html
 │       └── index.html
 ├── bravo.com
 │   └── index.html
 ├── charlie.com
 │  └── index.html
+└── certificates
```

then, create symlinks inside `certificates`. each one should be named `${domain name}` and should point to where the ssl certificates for that domain live on your server. for example, if you use letsencrypt, you might need to run this to create the symlink:

```
$ cd certificates
$ ln -s /etc/letsencrypt/live/alpha.com alpha.com
```

(the target of the symlink should be a directory containing the certificate files `fullchain.pem` and `privkey.pem`.)

```diff
 ├── alpha.com
 │   └── html
 │       └── index.html
 ├── bravo.com
 │   └── index.html
 ├── charlie.com
 │  └── index.html
 └── certificates
+    └── alpha.com -> /etc/letsencrypt/live/alpha.com
```

note that permissions will be tricky for most setups, if you aren't doing all of this as `root`. (everyone says never to use `root` for anything but my personal opinion is that `root` is fine for lots of cases where a host is only handling standard server operations like this.) for more info see [permissions](#permissions).

</details>

---

## cli

### `npx union`

starts or restarts the server. do this at startup, or after you add or remove a domain. optionally you can include a port number like this: `npx union 8080` to run the HTTP server on a custom port. (it defaults to :80.)

### `npx union status`

gives the status of the server.

### `npx union stop`

stops the server.

### `npx union lint`

loads all of your custom configs and confirms they are valid express apps. gives you verbose errors if not, including potential permissions problems.

### `npx union help`

shows the help screen.

---

## permissions

there are a few places where running a traditional web server requires elevated permissions. here are a few considerations you should be aware of:

<details>
<summary>listening on ports :80 and :443</summary>
most machines won't let you run a process that listens on ports :80/:443 (traditional web ports). in order to serve your domains from those ports, you will either need to run the server process as `root`, or follow instructions for your OS to open up those ports for regular users to open things on them. here's how to do that on most linux distributions:

```
echo 'net.ipv4.ip_unprivileged_port_start=0' | sudo tee /etc/sysctl.d/50-unprivileged-ports.conf && sudo sysctl --system
```

note: this allows any user on your system to open processes on these lower numbered ports. although, in my opinion, if you have compromised users on your system you've got bigger problems than whether they run something on port 80 or 3000.

</details>

<details>
<summary>starting the server when your machine boots</summary>
you will need to tell your machine to start the server when the machine starts, and ensure it is running as your preferred user, from your preferred directory. here are steps that work with most linux distributions:

1. **create the service file**

create a new systemd service file for your server:

```bash
sudo vim /etc/systemd/system/union.service
```

here's an example of that file:

```
[Unit]
Description=union
After=network-online.target multi-user.target

[Service]
Type=forking
User=<your user>
Group=<your user's group>
WorkingDirectory=<path to your domains directory; e.g. /var/www/vhosts>
ExecStart=/usr/bin/npx union
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

2. enable and start union
   after creating the service file, enable it to start at boot and then start the service immediately with the following commands:

```
sudo systemctl enable union
sudo systemctl start union
```

</details>

<details>
<summary>reading ssl certificates</summary>
SSL certificates need to be readable by the user who starts the web server. how you do that will depend on where your certificates live and how you renew them. let's use letsencrypt on debian as an example: the certificates are usually stored in `/etc/letsencrypt/live/yourdomain.com/`. by default, these certificates and their directories have restrictive permissions, only allowing root access.

one way around this would be to adjust permissions on the directories that contain the certificate files, giving some group read-access, and adding your user to that group. here's how to do that on a typical linux distribution with a typical letsencrypt/certbot setup.

oh, please note: adjusting permissions like this can potentially expose your SSL certificates to other users who have access to your system and can add themselves to your group. but again, if your host has been compromised and malicious users already have access to adding themselves to arbitrary groups, you have much bigger problems, imo.

1. add your non-privileged user to a specific group (e.g., `www-data`), which will be granted access to the certificates

```bash
sudo usermod -a -G www-data <your user>
```

2. change the group ownership of the `/etc/letsencrypt/archive/` and `/etc/letsencrypt/live/` directories to `www-data` (or your chosen group)

```
sudo chown -R root:www-data /etc/letsencrypt/archive/
sudo chown -R root:www-data /etc/letsencrypt/live/
```

3. set the permissions on the two main letsencrypt directories so that group members can read the files within them

```
sudo chmod 750 /etc/letsencrypt/{live,archive}
```

</details>
