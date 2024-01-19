import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { UserButton, auth } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

export default async function Home() {
  const {userId} = await auth();
  const isAuth = !!userId;
  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-yellow-100 via-yellow-300 to-yellow-500">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Let's get learning!</h1>
            <UserButton afterSignOutUrl="/"></UserButton>
          </div>

        <div className="flex mt-2">
        {isAuth && <Button>Go to Lessons</Button>}
        </div>

        <p className="max-w-xl mt-2 text-lg text-slate-600">
          Join many other students using AI to help them understand their lecture content, get your questions answered, revise for your exams and get essay help with AI
        </p>


        <div className="w-full mt-4">

        </div>
          {isAuth ? (
            <FileUpload/>
          ) : (
            <a href="/sign-in">
              <Button>Login to get Started
                <LogIn className="w-4 h-4 ml-2"/>
              </Button>
            </a>
          )}
        </div>
      </div>

    </div>
  )
}
