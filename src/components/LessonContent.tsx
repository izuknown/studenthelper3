import React from 'react';

type Props = {transcriptionurl: string};

const LessonContent = ({transcriptionurl}: Props) => {
  return (
    <iframe 
      src={`https://docs.google.com/gview?url=${transcriptionurl}&embedded=true`}
      className="w-full h-full"
    ></iframe>      
  );
};

export default LessonContent