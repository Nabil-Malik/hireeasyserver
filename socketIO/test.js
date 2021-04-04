module.exports = function (server) {
  const io = require('socket.io')(server)

  // Monitor the connection between the client and the server
  io.on('connection', function (socket) {
    console.log('A client connected to the server')

    // Binding listener, receive messages sent by the client
    socket.on('sendMsg', function (data) {
      console.log('The server receives the message sent by the client', data)
      // Data processing
      data.name = data.name.toUpperCase()
      // The server sends a message to the client
      // socket.emit('receiveMsg', data)
      io.emit('receiveMsg', data)
      console.log('The server sends a message to the client', data)
    })
  })
}