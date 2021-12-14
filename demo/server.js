const { createServer } = require("http");
const { readFileSync } = require("fs");
const { extname, join } = require("path");

const mime = {
  html: "text/html",
  js: "application/javascript",
};

createServer((req, res) => {
  const path = getPath(req.url);
  const ext = extname(path).substring(1);
  const contentType = path.startsWith("dist")
    ? mime.js
    : mime[ext] ?? mime.html;
  console.log(path, ext, contentType);
  res.setHeader("content-type", contentType);
  res.end(getFileContent(path, res));
}).listen(8000);

const getExt = (path) => extname(path).substring(1);

const getPath = (path) => {
  const ext = getExt(path);
  path = path === "/" ? "index.html" : path;
  path = path.startsWith("/dist") ? path.substr(1) : join("demo", path);
  if (!ext && path.startsWith("dist")) path = `${path}.js`;
  return path;
};

const getFileContent = (path) => {
  try {
    return readFileSync(path);
  } catch (e) {
    return e.code === "ENOENT" ? readFileSync("demo/index.html") : e.stack;
  }
};
