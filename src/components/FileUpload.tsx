'use client';
import { UploadToS3 } from '@/lib/s3';
import { useMutation } from '@tanstack/react-query';
import { Inbox, Loader2} from 'lucide-react';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {toast} from 'react-hot-toast';
import { useRouter } from 'next/navigation'

const FileUpload = () => {
  const router = useRouter() 
  const [uploading, setUploading] = React.useState(false)
  const { mutate, isPending } = useMutation({
    mutationFn: async({
      file_key,
      file_name
    }:{
      file_key:string, 
      file_name:string
    }) => {
      const response = await axios.post('/api/create-chat', {
        file_key, 
        file_name
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'video/mp4': ['.mp4','.MP4'],
      'audio/mp3':['.mp3', '.MP3'],
      'audio/wav': ['.wav', '.WAV']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024 * 1024){
        toast.error("File size is larger than 5GB. Please reduce file size.");
        return;
      }
      
      try {
        setUploading(true)
        console.log('Before UploadToS3');
        const data = await UploadToS3(file);
        if (!data?.file_key || !data.file_name){
          toast.error("Somthing has gone wrong, there is no file key or file name");
          return;
        }
        mutate(data, {
          onSuccess: (chat_id) =>{
            toast.success ("Chat Created");
            router.push(`/chat/${chat_id}`)

          },
          onError: (err) => {
            toast.error("Error creating chat");
            console.log('error creating chat', err)
          }, 
        });
        console.log('After UploadToS3, data:', data);
      } catch (error) {
        console.log('Error in FileUpload:', error);
      } finally {
        setUploading(false);
      }      
    }, 


  });
  return (
    <div className="p-3 bg-white rounded-xl">
      <div
        {...getRootProps({
          className: 
          "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading || isPending ?(
          <>
            {/* loading state */}
            <Loader2 className='h-10 w-10 text-yellow-600 animate-spin'/>
            <p className='mt-2 text-sm text-slate-400'>
              Preparing your tutor now. Please wait...
            </p>
          </>
        ):(
          <>
            <Inbox className="w-10 h-10 text-yellow-600" />
            <p className='mt-1 text-yellow-600'>Drop your lesson recording here</p>
        </>
        ) } 
      </div>
    </div>
  );
};

export default FileUpload;