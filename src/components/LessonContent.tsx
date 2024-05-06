import React from 'react';

type Props = {pdfFilePath: string};

const LessonContent = ({pdfFilePath}: Props) => {
  console.log('pdfFilePath: lesson content', pdfFilePath)
  return (
    <iframe 
    src={`https://docs.google.com/gview?url=${pdfFilePath}&embedded=true`}
    className="w-full h-full"
  ></iframe>
     
  );
};

export default LessonContent