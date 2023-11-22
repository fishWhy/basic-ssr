// 实验对于htt2协议，renderToPipeableStream是否仍可用
const http2 = require('spdy');
const express = require('express');
const render = require('./server/render').default;
const fs = require('fs');

const app = express();

app.use(express.static('build'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  render(res);
});

var options = {
  key: fs.readFileSync('./ca/server.key'),
  cert: fs.readFileSync('./ca/server.crt')
}

http2.createServer(options, app).listen(3000, () => {
  console.log(`Server is listening on https://127.0.0.1:3000 .`)
})
