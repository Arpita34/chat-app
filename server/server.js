import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io"

//create express app using http
const app=express();
const server=http.createServer(app);

//intialize socket.io server
//const allowedOrigins = ["https://yourdomain.com", "https://anotherdomain.com"];

const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5173"];

export const io=new Server(server,{
    cors:{
        origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    }
})


//store online users
export const userSocketMap={};//{userId:socketId}

//socket.io connection handler
io.on("connection",(socket)=>{
   const userId=socket.handshake.query.userId;
   console.log("User connected",userId);

   if(userId) userSocketMap[userId]=socket.id;
   //emit online users to all connected clients

   io.emit("getOnlineUsers",Object.keys(userSocketMap))

   socket.on("disconnect",()=>{
    console.log("User Disconnected",userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers",Object.keys(userSocketMap))
   })
})

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

//middleware setup
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
};


// Apply CORS middleware globally
app.use(cors(corsOptions));//restricts CORS to allowed domains

//Routes setup
app.use("/api/status",(req,res)=>res.send("Server is live"));
app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter)

//connect to mongodb
await connectDB();




if(process.env.NODE_ENV!="production"){
const PORT=process.env.PORT|| 5000;

server.listen(PORT,()=>
    console.log(`Server is running on PORT:${PORT}`)
);
}




//export  server for vercel
export default server



