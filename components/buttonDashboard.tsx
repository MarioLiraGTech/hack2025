"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function ButtonDashboard() {
	const router = useRouter();

	const handleClick = () => {
		router.push('/prueba');
	};

	return (
		<div className="w-full flex justify-center">
			<Button className="button-dashboard" onClick={handleClick}>
				Comenzar
			</Button>
		</div>
	);
}

export default ButtonDashboard

