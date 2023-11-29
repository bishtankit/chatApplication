const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();

const server = createServer(app);

const io = new Server(server, {
    cors: true
});

const path = require('path')
// app.use(express.static('public'));

app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public/home.html'))
});

app.get('/room/:roomID', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/room.html'))
    });


const users = [];

io.on('connection', (socket) => {

  console.log('a user connected', socket.id);

  socket.on('joinRoom', (data) => {
    try {
        users.push({userName: data.userName, id: socket.id, roomID: data.roomID, dummy: true})
        data.chatID = socket.id;
        socket.emit('redirect-to-room', data);
    } catch (error) {
        console.log(error)
    }
  });

  socket.on('disconnect', () => {
    // console.log('user disconnected', socket.id);

    try {
        const foundUser = users.find((user)=>{
            return user.id == socket.id;
          });
      
          if( foundUser.dummy == false){
              const foundRoomID = foundUser.roomID;
              io.in(foundRoomID).emit("user-left", foundUser.userName);
          }
    } catch (error) {
        console.log(error)
    }
    // const foundUser = users.find((user)=>{
    //     return user.id == socket.id;
    //     });

    // const index = users.indexOf(foundUser)    

    // if (index > -1) {
    //     users.splice(index, 1);
    //   }
     
    // console.log("removed user", foundUser)  
  });

  socket.on("new-message", (data)=>{
 
    try {
        const foundUser = users.find((user)=>{
            return user.id == data.chatID
          })
     
          const foundRoomID = foundUser.roomID;
     
         io.in(foundRoomID).emit("broadcast-message", data);
    } catch (error) {
        console.log(error)
    }
      
  })

socket.on("updateUser", (data, callback)=>{

    try {
        const foundUser = users.find((user)=>{
            return user.id == data.chatID;
            });
            
            const index = users.indexOf(foundUser)
            
            if (index > -1) {
                users.splice(index, 1);
              }
            
              foundUser.id = socket.id;
              foundUser.dummy = false;
              users.push(foundUser);
            
              socket.join(foundUser.roomID)
              callback({
                chatID: socket.id,
                userName: foundUser.userName
              });
            
              io.in(foundUser.roomID).emit("user-joined", {userName: foundUser.userName, id: socket.id});
    } catch (error) {
        console.log(error);
    }

})

});


server.listen(5000, function(){
    console.log("server started on port 5000");
})