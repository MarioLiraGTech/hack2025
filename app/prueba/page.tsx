"use client"

import {QuestionForm} from "@/components/question-form"
export default function PruebaPage() {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-100 font-sans ">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <QuestionForm onComplete={(answers) => console.log(answers)} />
            </div>
        </div>
    );
}