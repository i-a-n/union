# union

union is a nodejs web server that makes it easy to serve multiple domains from a single host. it was originally developed to replace simple nginx/apache setups with express. some important features are:

- written in node, so it's easy to install and run using `npm`
- can be called with no configuration in a traditional `/var/www/vhosts`-style directory, and will serve each domain it finds there
- uses express as its web server, so optional per-domain configurations can be written just like normal express apps
- uses pm2 to manage a daemon, so the server will restart if it crashes, and can run forever
- serves https with minimal configuration
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
// include express. you can use `union/express` for simplicity.
const express = require('union/express');

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

3. putting a plaintext file named `.union-password` in a directory will make that directory password-protected, just like how `.htpasswd` would work in a traditional httpd directory:

```
user: admin
pass: 13f5a5b5456a
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

(the target of the symlink should be a directory containing the certificate files.)

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

note that permissions will be tricky for most setups, if you aren't doing all of this as `root`. (everyone says never to use `root` for anything but my personal opinion is that `root` is fine for this kind of stuff. if you're on a host that's only serving your domains, if that server is compromised it doesn't really matter what user was running it!) for more info see [permissions](#permissions).

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

---

## permissions

there are a few places where running a traditional web server requires elevated permissions. here are a few considerations you should be aware of:

<details>
<summary>listening on ports :80 and :443</summary>
most machines won't let you run a process that listens on ports :80/:443 (traditional web ports)

[TODO: solution]

</details>

<details>
<summary>starting the server when your machine reboots</summary>
you will need to tell your machine to start union when the machine starts; ensure it runs it as the proper user

[TODO: example]

</details>

<details>
<summary>reading ssl certificates</summary>
ssl certificates need to be readable by the user who starts the web server

[TODO: example using letsencrypt]

</details>
