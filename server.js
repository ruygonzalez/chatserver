var net = require("net");

function ChatServer(port) {
  this.port = port;
  this.totalClients = 0;
  this.clients = {};
  this.server = net.createServer();

  this.attachListeners();

  this.server.listen(port, function(){
    console.log("Server listening on port " + port);
  });
}

// Broadcast the same message to each connected client.
ChatServer.prototype.broadcast = function(message) {
  for (var key in this.clients) {
        if (this.clients.hasOwnProperty(key)) {   
          var s = this.clients[key];
          s.write(JSON.stringify(message));
        }
  }
};

// This function is called whenever a new client connection is made.
ChatServer.prototype.onConnection = function(socket) {
  // Increment IDs
  this.totalClients += 1;
  var clientid = this.totalClients;
  var mys = this;
  // Log which client connected and send OK to client
  console.log("Client #" + clientid.toString() + " connected!");
  var ok = {
    "type" : "OK",
    "id" : clientid
  };
  socket.write(JSON.stringify(ok));
  // Use broadcast function to send a join JSON message
  var joined = {
    "type" : "JOIN",
    "id" : clientid
  };
  ChatServer.prototype.broadcast.bind(mys)(joined);
  // Broadcast msg message when "data" event comes from client
  socket.on("data", function(data){
    var par = JSON.parse(data);
    var msg = {
      "type" : "MSG",
      "id" : clientid,
      "message" : par
    };
    ChatServer.prototype.broadcast.bind(mys)(msg);
    console.log("RECV(" + clientid + "): " + par);
  });
  // Handle client closing when "close" event comes from client
  socket.on("close", function(transmissionerror){
    if(!transmissionerror){
      // delete client from the this.clients list 
      for (var key in mys.clients) {
        if (mys.clients.hasOwnProperty(key) && key === clientid.toString()) {           
          delete mys.clients[key];
          break;
        }
      }
      var leave = {
        "type" : "LEAVE",
        "id" : clientid
      }; 
      // notify everyone remaining that the client left
      ChatServer.prototype.broadcast.bind(mys)(leave);
      console.log("Client #" + clientid + " closed its connection.");
    }
    else{
      console.log("Transmission error");
    }
    this.totalClients -= 1;
  });
  // Add client to clients map
  this.clients[clientid.toString()] = socket;
};

// Attach listeners for "connection" and "error" events.
ChatServer.prototype.attachListeners = function() {
  // Handle connection and error events
    var own = this;
    this.server.on("connection", function(socket){
      ChatServer.prototype.onConnection.bind(own)(socket);
    });
    this.server.on("error", function(socket){
      console.log("There was an error");
    });
};

var server = new ChatServer(4242);
