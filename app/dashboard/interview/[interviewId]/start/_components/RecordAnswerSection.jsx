"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModal'
import { db } from '@/utils/db'
import { useUser } from '@clerk/nextjs'
import moment from 'moment'
import { UserAnswer } from '@/utils/schema'

function RecordAnswerSection({mockInterviewQuestions,activeQuestionIndex,interviewData}) { 
    const [userAnswer,setuserAnswer] = useState('');
    const {user} = useUser();
    const [loading,setloading] = useState(false); 
    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
        setResults
      } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
      });

      useEffect(()=>{
        results.map((result)=>(
            setuserAnswer(prevAns=>prevAns+result?.transcript)
        ))
      },[results]);

      useEffect(()=>{
        if(!isRecording&&userAnswer.length>10){
          UpdateUserAnswer();
        }
      },[userAnswer]);

      const StartStopRecording=async()=>{
        if(isRecording){
          stopSpeechToText()
        }
        else{
          startSpeechToText();
        }
      }

      const UpdateUserAnswer = async() => {
        console.log(userAnswer)
        setloading(true);
        const feedbackPrompt = "Question:"+mockInterviewQuestions[activeQuestionIndex]?.question+
        ", User Answer:"+userAnswer+",Depends on question and user answer for given interview question "+
        "please give us rating for answer and feedback as area of improvement if any "+
        "in just 3 to 5 linesto improve in JSON format with rating field and feedback field";

        const result = await chatSession.sendMessage(feedbackPrompt);

        const mockJsonResp = (result.response.text()).replace('```json','').replace('```','');
        console.log(mockJsonResp);
        const jsonFeedbackResp = JSON.parse(mockJsonResp); 

          // console.log('interviewData:', interviewData);
          // console.log('mockId:', interviewData?.mockID);
        

        const resp = await db.insert(UserAnswer)
        .values({
          mockIdRef:interviewData?.mockID,
          question:mockInterviewQuestions[activeQuestionIndex]?.question,
          correctAns:mockInterviewQuestions[activeQuestionIndex]?.answer,
          userAns:userAnswer,
          feedback:jsonFeedbackResp?.feedback,
          rating:jsonFeedbackResp?.rating,
          userEmail:user?.primaryEmailAddress.emailAddress,
          createdAt:moment().format('DD-MM-yyyy')
        })

        if(resp){
          toast('User answer recorded successfully')
          setuserAnswer('');
          setResults([]);
        }
        setResults([]);
        setloading(false);
      }
    
  return (
    <div className='flex flex-col justify-center items-center'>
        <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
            <Image src={'/image.png'} width={200} height={200}
            className='absolute'/>
            <Webcam
            mirrored={true}
            style={{
                height:300,
                width:'100%',
                zIndex:10
            }}/>
        </div>
        <Button disabled={loading} variant="outline" className='my-10'
        onClick={StartStopRecording}>
            {isRecording?
              <h2 className='text-red-600 flex gap-2'>
                <Mic/> Stop Recording...
              </h2>
              :
              'Record Answer'}</Button>
              
    </div>
  )
}

export default RecordAnswerSection