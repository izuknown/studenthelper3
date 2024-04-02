import React from 'react'

type Props = {contentURL: string}

const LessonContent = ({contentURL}: Props) => {
  return (
    <div>
        <iframe src={`https://docs.google.com/gview?url=${contentURL}&embedded=true`} className="w-full h-full">

        </iframe>
    </div>
  )
}

export default LessonContent