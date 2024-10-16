import { createServer } from 'node:http';
import './brainfuck.mjs'
import BrainfuckInterpreter from './brainfuck.mjs';

const hostname = '127.0.0.1';
const port = 7777;

const server = createServer(async (req, res) => {
    if (req.method == "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("Welcome to the Brainfuck API");
        return;
    }

    console.log(req.method, req.url, req.headers);

    let body = '';
    try {
        body = JSON.parse(await getRequestBody(req));
    } catch(e) {
        res.write('ERR');
        res.end();
        console.log('Body is not JSON');
        return;
    }
    
    let p = body;
    if (typeof(p.input) === 'string')
      p.input = p.input.split('').map(x => x.charCodeAt(0));
  
    const bfi = new BrainfuckInterpreter(p.code, p.input, p.bits, p.signed);
    console.log(`req: ${p.signed?'':'U'}${p.bits}bit\n     input: ${p.input}\n     code: ${p.code}`);
    
    bfi.run();
    while (bfi.isRunning()) {
      console.log(bfi.output);
    }
  
    console.log(`res: ${bfi.endState().status}\n     out: ${bfi.endState().output}`);
    res.write(JSON.stringify(bfi.endState()));
    res.end(); 
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getRequestBody(req) {
    return new Promise(resolve => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
    });
}