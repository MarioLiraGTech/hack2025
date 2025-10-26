"use client"

import { Button } from "@/components/ui/button"

export function ButtonDashboard() {
	const scrollToSection = () => {
		const section = typeof document !== 'undefined' ? document.getElementById('Graficas') : null;
		if (section) section.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<div className="w-full flex justify-center">
			{/* Render a real button that calls the scroll handler. Avoid Link so we don't navigate away. */}
			<Button className="button-dashboard" onClick={scrollToSection}>
				Comenzar
			</Button>
		</div>
	);
}

export default ButtonDashboard

