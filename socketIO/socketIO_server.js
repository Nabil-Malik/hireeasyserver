const {ChatModel} = require('../db/models')
module.exports = function (server) {
  const io = require('socket.io')(server)

  // Monitor the connection between the client and the server
  io.on('connection', function (socket) {
    console.log('A client connected to the server')

    // Binding listener, receive messages sent by the client
    socket.on('sendMsg', function ({from, to, content}) {
      console.log('The server receives the message sent by the client', {from, to, content})
      // Data processing
      // Prepare the relevant data of the chatMsg object
      const chat_id = [from, to].sort().join('_')// from_to或者to_from
      const create_time = Date.now()
      new ChatModel({from, to, content, chat_id, create_time}).save(function (error, chatMsg) {
        // Send messages to all connected clients
        io.emit('receiveMsg', chatMsg)
      })
    })
  })
}