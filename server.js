const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
require('dotenv').config()
const fetch = require("node-fetch");
const port = process.env.PORT || 5000;

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

app.get(`/agent`, async (req, res)=>{

    const id = req. query.visitorid;

    const response = await fetch(`https://api.upscope.io/v1.3/visitors/${id}/watch_url`, {
        method: 'post',
        body:    JSON.stringify(
            {
                "branding": {
                  "naked": true,
                },
                "permissions": {},
                "agent": {
                  "id": "123",
                  "name": "Joe Smith"
                },
                "metadata": {},
                "webhook_url": "https://example.com"
              }
        ),
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': 'BzBQwTHvMDtNLzyUtAZtDGXpCkGSHhprnTmJmesCcdSuhcU8AV' },
    });

    const data = await response.json();
    console.log("data >>", data)

})

app.get('/visitor', async (req,res)=>{

    const response = await fetch('https://api.upscope.io/v1.3/proxy_sessions', {
        method: 'post',
        body:    JSON.stringify({
            "initial_url": "/",
            "allowed_domains": ["/"],
            "branding": {
              "retry_url": null
            },
        }),
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': 'BzBQwTHvMDtNLzyUtAZtDGXpCkGSHhprnTmJmesCcdSuhcU8AV' },
    });

    const data = await response.json();
    console.log("data >>", data)

    res.send(data)

})


const users = [];
// const rooms = [];

io.on('connection', (socket) => {

  console.log('a user connected', socket.id);

  socket.on('joinRoom', (data) => {
    try {
        users.push({userName: data.userName, id: socket.id, roomID: data.roomID, dummy: true})
        data.chatID = socket.id;
    // const foundRoom = rooms.find((room)=>{
    //          return room.roomID == data.roomID;
    //     });

        // if( foundRoom ){
        //    console.log("room found", foundRoom);
        // }else{
        //     console.log("room not found");
        //     rooms.push({
        //         roomID: data.roomID,
        //         userName: userName.push(data.userName)
        //     })
        // }
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


server.listen(port, function(){
    console.log(`server started on port ${port}`);
})