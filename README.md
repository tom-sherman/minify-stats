# Minified & Unminified: Gzip vs Brotli

A script to collect size data using gzip vs brotli compression as well as using a minifier before compressing.

## Collecting your own data

Requires Node 12+, `brotli`, `gzip`, and `wc`.

### Install dependencies

```
npm install
```

### Run script

Replace `glob/**/*` with a glob to find Javascript files

```
node collect.js "glob/**/*"
```

This will output a table to the terminal as well as save a CSV file.
