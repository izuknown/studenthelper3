import React from 'react';
import { Input } from './ui/input';
import { useChat } from 'ai/react';
import { Send } from 'lucide-react';

type Props = {};

const ChatComponent = (props: Props) => {
  const { input, handleInputChange, handleSubmit } = useChat();
  return (
    <div className="relative max-h-screen overflow-scroll">
        <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
            <h3 className="text-xl font-bold">Chat with your tutor</h3>
        </div>

    {/* MESSAGE COMPONENT */}

    <form onSubmit={handleSubmit} className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white">
        <Input value={input} onChange={handleInputChange} placeholder="Ask your first question..." className="w-full"/>
        <button className="bg-blue-600 ml-2">
            <Send className="h-4 w-4" />
         </button>
    </form>
        </div>
    )
}

export default ChatComponent