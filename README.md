# proginoskes
Monitor your infrastructure in real time using ssh to centralize a stream of log events

## install ##
To install `npm install proginoskes`

## configuration ##
The available configuration sections and options.

1. `global`: Anything defined here is applied to all defined hosts
  1. `host`: A host name defined here will work as a defined host
  2. `port`: The default is 22 and is applied to all hosts unless explicitly defined
  3. `username`: A username defined here will apply to all hosts
  4. `password`: A password defined here will also apply to all hosts
  5. `privateKey`: The path to a private ssh key (also applies to all defined hosts)
  6. `logs`: An array of logs to monitor for all defined hosts
2. `hosts`: The recommended method of including `host` definitions
  1. `host`: The name or IP of machine to apply log monitoring streams
  2. `port`: The SSH port for this particular host, uses global `port` option if omitted
  3. `username`: The username for access, also uses the global `username` option if omitted
  4. `password`: The password for access, again, uses the global `password` option if omitted
  5. `privateKey`: The path to an SSH private key to use with this host. Will also use anything defined in global `privateKey` if omitted
  6. `logs`: An array of logs to monitor for this host. Adds to anything defined in global `logs` array

_Example_
```javascript
var options = {
  global: {
    port: 22,
    username: 'root',
    privateKey: './path/to/global/privatekey',
    logs: [
      '/var/log/ufw.log' //all hosts stream this log
    ]
  },
  hosts: [
    {
      host: 'host-1.example',
      privateKey: './path/to/host-1.example/privatekey',
      logs: [
        '/var/log/snort/snort.log',
        '/var/log/audit/audit.log',
        '/var/log/kern.log'
      ]
    },
    {
      host: 'host-2.example',
      port: 2222,
      username: 'iamroot',
      privateKey: './path/to/host-2.example/privatekey',
    },
    {
      host: 'host-3.example',
      password: 'secret-sauce',
      logs: [
        '/var/log/iptables.log',
        '/var/log/audit/audit.log'
      ]
    }
  ]
};
```

## usage ##
Once you have a good configuration with at least one defined host to monitor
usage is easy.

_Example_
```javascript
var cherubum = require('proginoskes');

cherubum.proginoskes(options, function(err, data) {
  if (err) throw err;

  console.log(data);
});
```

## returned object ##
The returned object(s) are simple, but makes it easy to determine source.

_Example_
```javascript```
[ { server: 'server-1',
    log: '/var/log/ufw.log',
    data: 'Jan  9 07:24:12 node kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:55:0a:00:02:02:08:00 SRC=192.168.2.8 DST=10.0.2.15 LEN=44 TOS=0x00 PREC=0x00 TTL=64 ID=1593 PROTO=TCP SPT=60948 DPT=443 WINDOW=8760 RES=0x00 SYN URGP=0' },
  { server: 'server-2',
    log: 'access-logs/some-site.com',
    data: 'xxx.xxx.xxx.xxx - - [09/Jan/2015:08:23:13 -0600] "POST /wp-cron.php?doing_wp_cron=1420813393.8197140693664550781250 HTTP/1.0" 200 - "-" "WordPress/4.0.1; http://some-site.com"' } ]
```
