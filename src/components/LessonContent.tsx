import React from 'react'

type Props = {contentURL: string}

const LessonContent = ({contentURL}: Props) => {
  return (
    <iframe src={`https://docs.google.com/gview?url=${contentURL}&embedded=true`} className="w-full h-full"></iframe>      
  );
};

export default LessonContent