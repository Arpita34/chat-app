import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast";


export const ChatContext=createContext();

export const ChatProvider=({children})=>{

    const [messages,setMessages]=useState([]);
    const [users,setUsers]=useState([]);
    const [selectedUser,setSelectedUser]=useState(null);
    const [unseenMessages,setUnseenMessages]=useState({})

    const {socket,axios}=useContext(AuthContext);

   //function to get all users for sidebar
   const getUsers=async()=>{
    try{
       const {data}= await axios.get("api/messages/users");
       if(data.success){

        console.log("Unseen messages map after fetching users:", JSON.stringify(data.unseenMessages, null, 2));
        
        // Normalize keys to strings
      const normalizedUnseen = {};
      for (const key in data.unseenMessages) {
        normalizedUnseen[key.toString()] = data.unseenMessages[key];
      }

        setUsers(data.users)
        setUnseenMessages(data.unseenMessages || {})
                  console.log("Normalized unseen messages map:", normalizedUnseen);
       }
    }catch(error){
         toast.error(error.message)
    }
   }


   //function to get messages for selected user

   const getMessages=async(userId)=>{
    try{
       const {data}= await axios.get(`api/messages/${userId}`);
       if(data.success){
        setMessages(data.messages)
       }else{
         toast.error(error.message)
       }
    }catch(error){
       toast.error("Failed to fetch messages.");
    }
}

   //function to send message to selected user
   const sendMessage=async(messageData)=>{
    try{
        const {data}=await axios.post(`/api/messages/send/${selectedUser._id}`
            ,messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages,data.newMessage])
            }else{
                  toast.error(error.message)
            }
   }catch(error){
            toast.error(error.message)
   }
   }

   //function to subscribe to messages for selected users,taht will help us to get 
   //new messages in real time

   const subscribetoMessages=async()=>{
    if(!socket) return;

    socket.on("newMessage",(newMessage)=>{
        if(selectedUser && newMessage.senderId===selectedUser._id){
            newMessage.seen=true;
            setMessages((prevMessages)=>[...prevMessages,newMessage])
            axios.put(`/api/messages/mark/${newMessage._id}`)
        }else{
            setUnseenMessages((prevUnseenMessages)=>{
           const updated={...prevUnseenMessages,[newMessage.senderId]:
                prevUnseenMessages[newMessage.senderId]?prevUnseenMessages[newMessage.senderId]+1:1
           }
           console.log("Unseen messages map after newMessage:", updated); // ✅ HERE
        return updated;
            })
        }
    })
   }

//function to unsubscribe from messages
const unsubscribeFromMessages=()=>{
    if(socket) socket.off("newMessage")
}

useEffect(()=>{
   subscribetoMessages();
   return()=> unsubscribeFromMessages()
},[socket,selectedUser])

   const value={
        messages,users,selectedUser,getUsers,getMessages ,setMessages,sendMessage,setSelectedUser,
        unseenMessages,setUnseenMessages

   }

    return(<ChatContext.Provider value={value} >
         {children}
    </ChatContext.Provider>)
}