Project tasks:

Amend the process of adding pdf to the database
Current issue: There is an issue with uploading the pdf to S3. check the pdfUpload.ts file. 

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