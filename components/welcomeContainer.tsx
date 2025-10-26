"use client"

import { ButtonDashboard } from "./buttonDashboard"
import { useUser } from "@clerk/nextjs";

import SplitText from "./ui/SplitText";

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};




export function WelcomeContainer() {
	const { user } = useUser();

	return (
		 <div className='welcome-container'>
            <SplitText className='welcome-text'
            text="Bienvenid@"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
            />

            <SplitText className='welcome-subtext'
            text={user?.fullName || "Usuario"}
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
            />

            <ButtonDashboard  />
            
          </div>
	)
}

export default WelcomeContainer;