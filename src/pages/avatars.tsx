import { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "@/assets/setting-icon";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export default function AvatarsPage() {
	const gradients = [
		{ id: 1, name: "Blue-Purple-Orange", gradient: "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)" },
		{ id: 2, name: "Blue-Turquoise", gradient: "linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)" },
		{ id: 3, name: "Light Blue-Purple", gradient: "linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)" },
		{ id: 4, name: "Pink-Turquoise", gradient: "linear-gradient(0deg, #D9AFD9 0%, #97D9E1 100%)" },
		{ id: 5, name: "Cyan-Magenta", gradient: "linear-gradient(90deg, #00DBDE 0%, #FC00FF 100%)" },
		{ id: 6, name: "Peach-Yellow", gradient: "linear-gradient(62deg, #FBAB7E 0%, #F7CE68 100%)" },
		{ id: 7, name: "Green-Yellow", gradient: "linear-gradient(45deg, #85FFBD 0%, #FFFB7D 100%)" },
		{ id: 8, name: "Sky Blue-Lavender", gradient: "linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%)" },
		{ id: 9, name: "Pink-Aqua", gradient: "linear-gradient(0deg, #FFDEE9 0%, #B5FFFC 100%)" },
		{ id: 10, name: "Blue-Green", gradient: "linear-gradient(0deg, #08AEEA 0%, #2AF598 100%)" },
		{ id: 11, name: "Yellow-Red", gradient: "linear-gradient(147deg, #FFE53B 0%, #FF2525 74%)" },
		{ id: 12, name: "Light Blue-Purple", gradient: "linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)" },
		{ id: 13, name: "Yellow-Pink", gradient: "linear-gradient(45deg, #FBDA61 0%, #FF5ACD 100%)" },
		{ id: 14, name: "Orange-Yellow", gradient: "linear-gradient(90deg, #FAD961 0%, #F76B1C 100%)" },
		{ id: 15, name: "Pink-Purple-Blue", gradient: "linear-gradient(225deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)" }
	];

	const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
	let [isOpen, setIsOpen] = useState(false);

	const changeGradient = () => {
		setCurrentGradientIndex((prevIndex) => (prevIndex + 1) % gradients.length);
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<Heading className="text-2xl font-semibold">Default User Avatar</Heading>			

			<div className="mt-8 space-y-10">
				<div className="flex flex-col items-center justify-center w-full h-full relative">
					<div className="absolute top-4 right-4">
						<Button plain aria-label="Avatar Settings" onClick={() => setIsOpen(true)}>
							<SettingsIcon />
						</Button>
						<Dialog open={isOpen} onClose={setIsOpen}>
							<DialogTitle>Avatar Customization Settings</DialogTitle>
							<DialogDescription>
									Customize the default user avatar 
							</DialogDescription>
							<DialogBody>
								
							</DialogBody>
							<DialogActions>
								<Button onClick={() => setIsOpen(false)}>Close</Button>
							</DialogActions>
						</Dialog>

					</div>
					<div
						className="w-80 h-80 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-105 hover:shadow-xl"
						style={{ backgroundImage: gradients[currentGradientIndex].gradient }}
						onClick={changeGradient}
						aria-label={`Change to ${gradients[currentGradientIndex].name}`}
					>
						<UserIcon className="w-40 h-40 text-white drop-shadow-md" />
					</div>
					<Subheading className="mt-4">Preview of default user avatar</Subheading>
				</div>
			</div>
		</div>
	);
}
