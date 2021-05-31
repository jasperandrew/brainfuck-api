var express = require('express');
var jsonParser = require('body-parser').json();
var app = express();
var serv = require("http").Server(app);
var BFI = require("./brainfuck")

app.post('/interpret', jsonParser, function(req, res) {
  let p = req.body;
  if (typeof(p.input) === 'string')
    p.input = p.input.split('').map(x => x.charCodeAt(0));

  let bfi = new BFI(p.code, p.input, p.bits, p.signed);
  console.log(`req: ${p.signed?'':'U'}${p.bits}bit\n     input: ${p.input}\n     code: ${p.code}`);
  
  bfi.run();
  while (bfi.isRunning()) {
    console.log(bfi.output);
  }

  res.send(bfi.endState());
  console.log(`res: ${bfi.endState().status}\n     out: ${bfi.endState().output}`);
});

serv.listen(process.env.PORT);
console.log("Server started");