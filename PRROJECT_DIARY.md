Project tasks:

Current issue: PDF is not being displayed and there is an issue with the chat feature:
[cause]: Error: Response error: {
    "error": {
      "message": "Additional properties are not allowed ('system' was unexpected) - 'messages.0'",
      "type": "invalid_request_error",
      "param": null,
      "code": null
    }
  }

It appears that there are additional properties which is causing the chat feature to break. Namely that 'system' was unexected - messages.0. Find out what is causing this trip up. 

Next task:
1. Fix visualisation issues
2. fix chat function. 

Objective: 
Get to a point where the PDF is showing in the PDF viewer and the chat funciton is working AND it takes it's context from the transcribed text. 


Fix Content Viewer:
1. Update schema to include transcription saved as pdf/txt file. 
   1.1 Save the transctiption to s3
   1.2 save the url to transcription
   1.3 display content
   ---
   v2 = Adapt transcription to make it visually appealing  

2. complete chat component 