import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TooltipProps {
	message: string;
	children: React.ReactNode;
	trigger: boolean;
}

export function Tooltip({ message, children, trigger }: TooltipProps) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (trigger) {
			setVisible(true);
			const timer = setTimeout(() => setVisible(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [trigger]);

	return (
		<div className="relative flex items-center">
			{/* Tooltip */}
			<AnimatePresence>
				{visible && (
					<motion.div
						initial={{ opacity: 0, y: -5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						transition={{ duration: 0.2 }}
						className="absolute bottom-full mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-md"
					>
						{message}
					</motion.div>
				)}
			</AnimatePresence>

			<div>{children}</div>
		</div>
	);
}
