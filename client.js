var net = require("net");
var readline = require("readline");

function ChatClient(port) {
  this.io = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // this.client is a socket connecting the client with the server
  this.client = net.connect(port);
  this.clientId = null;

  this.attachIOListeners();
  this.attachChatListeners();
}

ChatClient.prototype.attachIOListeners = function() {
  this.io.on("line", function(input){
    this.client.write(JSON.stringify(input)); // get input and send to server by writing
  }.bind(this));

  this.io.on("SIGINT", function() { // if client closed, end the connection and io, and set stuff to null
    console.log("Closing client...");
    this.client.emit("close", false);
    this.client.end();
    this.clientId = null;
    this.io.close();
    this.client = null;
  }.bind(this));
};

ChatClient.prototype.attachChatListeners = function() {
  this.client.on("data", function(data){
    var ms = JSON.parse(data); // parse the data to JSON from string, then check type (and id if applicable)
    if(ms.type === "OK"){
      this.clientId = ms.id;
    }
    else if(ms.type === "JOIN"){
      console.log("CLIENT #" + ms.id.toString() + " has joined.");
    }
    else if(ms.type === "MSG"){
      if(ms.id === this.clientId){
        console.log("ME: " + ms.message);
      }
      else{
        console.log("CLIENT #" + ms.id.toString() + ": " + ms.message);
      }
    }
    else if(ms.type === "LEAVE"){
      console.log("CLIENT #" + ms.id.toString() + " has left.");
    }
  }.bind(this));
  
  this.client.on("end", function() { // when client is ended
    if(this.client) { // if ended by server, end the client and output that the server closed connection
      console.log("Server closed connection");
      this.client.end();
      this.clientId = null;
      this.io.close();
      this.client = null;
    }
  }.bind(this));

  this.client.on("error", function(e) {
    // Handle errors
    this.client.emit("close", true);
    this.client.end();
    this.clientId = null;
    this.io.close();
    this.client = null;
  }.bind(this));
};

var client = new ChatClient(4242);
