import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {
        const {messages,selectedUser,setSelectedUser,sendMessage,
            getMessages}=useContext(ChatContext)
        const {authUser,onlineUsers}=useContext(AuthContext)
 
    const scrollEnd=useRef()


    const [input,setInput]=useState('')

    const handleSendMessage=async(e)=>{
        e.preventDefault()
        if(input.trim()==="") return null;
        await sendMessage({text:input.trim()})
        setInput("")
    }


    //handle sending an image
    const handleSendImage=async(e)=>{
        const file=e.target.files[0];
        if(!file || !file.type.startsWith("image/")){
            toast.error("Select an image")
            return;
        }
        const reader=new FileReader();

        reader.onloadend=async()=>{
            await sendMessage({image:reader.result})
            e.target.value=""
        }
        reader.readAsDataURL(file)
    }

    useEffect(()=>{
        if(selectedUser){
            getMessages(selectedUser._id)
        }
    },[selectedUser])

    useEffect(()=>{
       if(scrollEnd.current && messages){
        scrollEnd.current.scrollIntoView({behavior:"smooth"})
       }
    },[messages])


    return selectedUser?(
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
       {/* header */}
        <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500 '>
             <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
             <p className='flex-1 text-lg text-white flex items-center gap-2'>
              {selectedUser.fullName}
               {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
             </p>
           
             <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt="" 
             className='md:hidden max-w-7'/>
                <img src={assets.help_icon} alt="" className='md:hidden max-w-5' />
        </div>
        {/* chat area */}
        <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 
        pb-6'>
{messages.map((msg, index) => {
  const isOwn = msg.senderId === authUser._id;

  return (
    <div
      key={index}
      className={`flex items-end gap-2 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar (Left for others, Right for own message) */}
      {!isOwn && (
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-7 h-7 rounded-full"
        />
      )}

      <div className="flex flex-col items-end max-w-[60%]">
        {/* Message bubble or image */}
        {msg.image ? (
          <img
            src={msg.image}
            alt="Sent"
            className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden ${
              isOwn ? 'rounded-br-none self-end' : 'rounded-bl-none self-start'
            }`}
          />
        ) : (
          <p
            className={`p-2 md:text-sm font-light rounded-lg break-words text-white ${
              isOwn
                ? 'bg-blue-600 rounded-br-none self-end text-right'
                : 'bg-gray-700 rounded-bl-none self-start text-left'
            }`}
          >
            {msg.text}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-gray-400 mt-1 px-1">
          {formatMessageTime(msg.createdAt)}
        </p>
      </div>

      {/* Avatar for own message (right side) */}
      {isOwn && (
        <img
          src={authUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-7 h-7 rounded-full"
        />
      )}
    </div>
  );
})}
<div ref={scrollEnd}></div>
        </div>
        {/* bottom area */}

        <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
           <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
            <input onChange={(e)=>setInput(e.target.value)} value={input}
            onKeyDown={(e)=>e.key==="Enter"?handleSendMessage(e):null}
             type="text" placeholder='Send a message' 
            className='flex-1 text-sm p-3  border-none rounded-lg outline-none text-white placeholder-gray-400' />
            <input onChange={handleSendImage}
             type="file"  id="image" accept='image/png,image/jpeg' hidden/>
            <label htmlFor="image">
                <img src={assets.gallery_icon} alt=""  className='w-5 mr-2 cursor-pointer'/>
            </label>
           </div>
           <img src={assets.send_button} alt="" className='w-7 cursor-pointer' />
        </div>
        </div>
  ):(
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500
    bg-white/10 max-md:hidden'>
        <img onClick={handleSendMessage}
        src={assets.logo_icon} alt="" className='max-w-16' />
        <p className='text-lg font-medium text-white'>Chat anytime,anywhere</p>
    </div>
  )
}

export default ChatContainer