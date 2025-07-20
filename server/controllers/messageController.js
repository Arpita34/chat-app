import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import {io,userSocketMap} from "../server.js"
// get all users except loggen in users
export const getUsersForSidebar=async(req,res)=>{
    try{
           const userId=req.user._id;
           const filteredUsers=await User.find({_id:{$ne:userId}}).select(
            "-password");

            //count no.of messages nt seen
            const unseenMessages={}
            const promises=filteredUsers.map(async(user)=>{
                const messages=await Message.find({
                    senderId:user._id,
                    receiverId:userId,
                    seen:{ $ne: true }
                })
                    if(messages.length>0){
                        unseenMessages[user._id.toString()]=messages.length;
                    }
            })
            await Promise.all(promises);
                console.log("👉 Backend unseenMessages:", unseenMessages);
            res.json({success:true,users:filteredUsers,unseenMessages})
    }catch(error){
            console.log(error.message);
            res.json({success:false,message:error.message})
    }
}

//get all messages for selected users

export const getMessages=async(req,res)=>{
    try{
          const {id:selectedUserId}=req.params;
           const myId=req.user._id;
           
           
           const messages=await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ]
           })

           await Message.updateMany({senderId:selectedUserId,receiverId:myId},
            {seen:true});

            res.json({success:true,messages});


    }catch(error){
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen=async(req,res)=>{
          try{
                  const {id}=req.params;
                  await Message.findByIdAndUpdate(id,{seen:true})

                  res.json({success:true})
          }catch(error){
             console.log(error.message);
        res.json({success:false,message:error.message});
          }
}

//sent message to selected user
export const sendMessage=async(req,res)=>{
    try{
const {text,image}=req.body;
const receiverId=req.params.id;
const senderId=req.user._id;
//if we have image to upload,we need to upload it on cloudinary

      let imageUrl;
      if(image){
         const uploadResponse=await cloudinary.uploader.upload(image)
         imageUrl=uploadResponse.secure_url;
      }

      const newMessage=await Message.create({
        senderId,
        receiverId,
        text,
        image:imageUrl
      })

      //emit the new message to the receiver id
      const receiverSocketId=userSocketMap[receiverId];
      if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage",newMessage)
      }

      res.json({success:true,newMessage});
    }catch(error){
            console.log(error.message);
        res.json({success:false,message:error.message});
       
    }
}