//---------------------------------------- BASIC WORKER STUFF -----//

// mowTheLawn.js -- web worker script
onmessage = function(event) {
  const lawnSize = event.data.width * event.data.length;
  const mower = new LawnMower('GrassMaster2000');
  const grassyKnoll = new Lawn(lawnSize);

  // lots of grass! this will take some time...
  while (grassyKnoll.isLong) {
    mower.mow(grassyKnoll);
  }

  // the job's done let's tell the world!
  postMessage(grassyKnoll);
}


// app.js -- main javascript file
// instantiate a new web worker
const lawnWorker = new Worker('mowTheLawn.js');

// ask the worker to get to work
lawnWorker.postMessage(shaggyLawn);

// what to do when the worker is finished
lawnWorker.onmessage = function(mowedLawn) {
  compostHeap.push(mowedLawn.clippings);
  alert('Lawn is mowed!');
};

//----------------------------------------------------------------//


//---------------------------------------- POOL SAMPLE STUFF 1 ---//

// let's build a pool!
// we need three classes...
// let's start with the pool
class Pool {
  constructor(size) {
    this.size = size;       // pool size (number of threads)
    this.workerQueue = [];  // lazy dads in the pool
    this.taskQueue = [];    // tasks waiting for a free worker
  }
}

// here's a thread
class Thread {
  constructor(pool) {
    this.pool = pool;  // a refrence to the pool this thread lives in
    this.task = {};    // storage for the task this thread will run
  }
}

// and here's a task
class Task {
  constructor(script, payload, callback) {
    this.script = script;       // worker script (eg. mowTheLawn.js)
    this.payload = payload;     // arguments to pass to the function
    this.callback = callback;   // who to call when the task is done
  }
}

//----------------------------------------------------------------//


//---------------------------------------- POOL SAMPLE STUFF 2 ---//

// let's make our classes useful
class Pool {
  constructor(size) {
    this.size = size;     // pool size (number of threads)
    this.threads = [];    // thread storage
    this.taskQueue = [];  // tasks waiting for an open thread
  }

  initialize() {
    // time to build our threads
    for (let i = 0; i < this.size; i++) {
      this.workerQueue.push(new Thread(this));
    }
  }

  addTask(task) {
    if (this.workerQueue.length > 0) {
      // get the worker from the front of the queue
      const thread = this.workerQueue.shift();
      thread.run(task);
    } else {
      // no free workers!
      this.taskQueue.push(new Thread(this));
    }
  }

  freeThread(thread) {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      thread.run(task);
    } else {
      this.taskQueue.push(thread);
    }
  }
}

class Thread {
  constructor(pool) {
    this.pool = pool;  // a refrence to the pool this thread lives in
    this.task = {};    // storage for the task this thread will run
    
    // callback that triggers the actual callback and frees up the thread
    this.dummyCallback = (event) => {
      this.task.callback(event);
      this.pool.freeThread(this);
      this.task.terminate() // terminates worker
    };
  }

  run(task) {
    this.task = task;
    const worker = new Worker(task.script);
    worker.addEventListener('message', this.dummyCallback);
    worker.postMessage(task.payload);
  }
}

class Task {
  constructor(script, payload, callback) {
    this.script = script;       // worker script (eg. mowTheLawn.js)
    this.payload = payload;     // arguments to pass to the function
    this.callback = callback;   // who to call when the task is done
  }
}

//----------------------------------------------------------------//





// now let's set up the pool
const myThreads = navigator.hardwareConcurrency || 4;
const pool = new Pool(myThreads);
pool.initialize();

// set up the tasks...
const mowTheLawn = new Task('mowTheLawn.js', lawn, mowCallback);
const getThePizza = new Task('getThePizza.js', pizzaOrder, pizzaCB);
const bbqChicken = new Task('bbqChicken.js', { rawChicken, bbqSauce }, bbqCB);
const pickUpKids = new Task('pickUpKids.js', { map, kidsList }, pickUpCB);

// finally we can assign tasks to the pool!
pool.addTask(mowTheLawn);
pool.addTask(getThePizza);
pool.addTask(bbqChicken);
pool.addTask(pickUpKids);