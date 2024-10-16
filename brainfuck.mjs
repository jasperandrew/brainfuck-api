class MemoryTape {
  constructor(bits, signed) {
    if(signed){
      bits = bits - 1;
      let p = Math.pow(2, bits);
      this.max = p - 1;
      this.min = -1 * p;
    }else{
      this.max = Math.pow(2, bits) - 1;
      this.min = 0;
    }
    this.pos = 0;   // Current pointer position
    this.tape = {}; // Memory tape object
  }

  fwd() { this.pos++; } // Move pointer position forward
  bwd() { this.pos--; } // Move pointer position backward

  inc() { // Increment the value at the current position
    let v = this.tape[this.pos] | 0;
    if(v === this.max) this.tape[this.pos] = this.min; // Overflow
    else this.tape[this.pos] = v + 1;
  }

  dec() { // Decrement the value at the current position
    let v = this.tape[this.pos] | 0;
    if(v === this.min) this.tape[this.pos] = this.max; // Overflow
    else this.tape[this.pos] = v - 1;
  }

  get() { // Get the value in memory at the current position
    return this.tape[this.pos] | 0;
  }

  put(x) { // Put a value into memory at the current position
    if(typeof(x) !== 'number'){
      console.error('Not a number: ' + x);
      return;
    }
    
    this.tape[this.pos] = 0;
    if(x === 0) return;
    while(x !== 0){
      if(x > 0){
        this.inc();
        x--;
      }else{
        this.dec();
        x++;
      }
    }
  }
}

class StringStream {
  constructor(input) {
    this.setStream(input);
  }

  setStream(input) {
    this.stream = input.toString();
    this.pos = 0;
  }

  len() { return this.stream.length; }
  end() { return this.pos >= this.stream.length; }

  get(n=1) { // TODO // Check if stream ends
    let p = this.pos;
    this.pos = (p + n > this.stream.length ? this.stream.length : p + n);
    return this.stream.substring(p, this.pos);
  }

  skip(n=1) { // Skips characters in the stream. Returns the number of characters skipped.
    let p = this.pos;
    this.pos = (p + n > this.stream.length ? this.stream.length : p + n);
    return this.pos - p;
  }

  rewind(n=1) { // Moves the pointer backwards. Returns the number of characters rewound.
    let p = this.pos;
    this.pos = (p - n < 0 ? 0 : p - n);
    return p - this.pos;
  }
}

class BrainfuckInterpreter extends StringStream {
  constructor(code, input, bits, signed) {
    super('');
    
    this.OP_CHARS = '+-<>[],.';
    this.memory = new MemoryTape(bits, signed);
    this.output = [];

    this.config = `${signed?'':'U'}${bits}`;

    this.setStream(code);
    this.input = input;
    this.status = 'initialized';

    this.op = {
      '>': () => {
        this.memory.fwd();
        return 0;
      },
      '<': () => {
        this.memory.bwd();
        return 0;
      },
      '+': () => {
        this.memory.inc();
        return 0;
      },
      '-': () => {
        this.memory.dec();
        return 0;
      },
      '.': () => {
        this.output.push(this.memory.get());
        return 0;
      },
      ',': () => {
        let value = this.input.shift();
        if (value === undefined) return 2;
        this.memory.put(value);
        return 0;
      },
      '[': () => { // TODO // stop on missing loop brackets
        if(this.memory.get() === 0){
          this.next();
          let nested = 0,
            char = this.get();
          while(char !== ']' || nested > 0){
            if     (char === '[') nested++;
            else if(char === ']') nested--;
            this.next();
            char = this.get();
          }
        }
        return 0;
      },
      ']': () => {
        if(this.memory.get() !== 0){
          this.prev();
          let nested = 0,
            char = this.get();
          while(char !== '[' || nested > 0){
            if     (char === ']') nested++;
            else if(char === '[') nested--;
            this.prev();
            char = this.get();
          }
        }
        return 0;
      }
    }
  }

  // StringStream overrides/aliases
  get() { return this.stream.substring(this.pos, this.pos+1); }
  find() {
    let chr = this.get();
    // console.log(this.OP_CHARS.indexOf(chr), chr);
    while(this.OP_CHARS.indexOf(chr) === -1){
      this.next();
      chr = this.get();
    }
    return chr;
  }
  next() { this.skip(); }
  prev() { this.rewind(); }

  // BrainfuckInterpreter methods
  handleRetCode(c) {
    switch(c){
      case -1: this.status = 'stopped'; break; // Parse error
      case 1:  this.status = 'complete'; break; // Completed
      case 2:  this.status = 'waiting'; break; // Waiting for input
    }
  }

  run() {
    if(this.status === 'running') return;
    if(this.end()) this.reset();
    this.status = 'running';
    while(!this.end()){
        this.step();
        if(['stopped','waiting'].indexOf(this.status) > -1) return;
    }
    this.status = 'complete';
  }

  step() {
    let cmd = this.op[this.find()];
    if(cmd){
      let c = cmd();
      if(c !== 0){
        this.handleRetCode(c);
        return c;
      }
    }
    this.next();
    return 0;
  }

  isRunning() { return this.status === 'running'; }

  endState() {
    return {
      'config': this.config,
      'status': this.status,
      'output': this.output
    }
  }
}

export default BrainfuckInterpreter