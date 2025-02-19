import { useEffect, useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "@/assets/setting-icon";
import { Heading, Subheading } from "@/components/ui/heading";
import { Strong } from "@/components/ui/text";
import { Dialog, DialogActions, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import { Radio, RadioField, RadioGroup } from "@/components/ui/radio";
import { Label } from "@/components/ui/fieldset";

export default function AvatarsPage() {

	const gradients = [
		{ id: 1, name: "Blue-Purple-Orange", gradient: "linear-gradient(to right, #4158D0, #C850C0, #FFCC70)" },
		{ id: 2, name: "Blue-Turquoise", gradient: "linear-gradient(to right, #0093E9, #80D0C7)" },
		{ id: 3, name: "Light Blue-Purple", gradient: "linear-gradient(to right, #8EC5FC, #E0C3FC)" },
		{ id: 4, name: "Pink-Turquoise", gradient: "linear-gradient(to right, #D9AFD9, #97D9E1)" },
		{ id: 5, name: "Cyan-Magenta", gradient: "linear-gradient(to right, #00DBDE, #FC00FF)" },
		{ id: 6, name: "Peach-Yellow", gradient: "linear-gradient(to right, #FBAB7E, #F7CE68)" },
		{ id: 7, name: "Green-Yellow", gradient: "linear-gradient(to right, #85FFBD, #FFFB7D)" },
		{ id: 8, name: "Sky Blue-Lavender", gradient: "linear-gradient(to right, #8BC6EC, #9599E2)" },
		{ id: 9, name: "Pink-Aqua", gradient: "linear-gradient(to right, #FFDEE9, #B5FFFC)" },
		{ id: 10, name: "Blue-Green", gradient: "linear-gradient(to right, #08AEEA, #2AF598)" },
		{ id: 11, name: "Yellow-Red", gradient: "linear-gradient(to right, #FFE53B, #FF2525)" },
		{ id: 12, name: "Light Blue-Purple", gradient: "linear-gradient(to right, #21D4FD, #B721FF)" },
		{ id: 13, name: "Yellow-Pink", gradient: "linear-gradient(to right, #FBDA61, #FF5ACD)" },
		{ id: 14, name: "Orange-Yellow", gradient: "linear-gradient(to right, #FAD961, #F76B1C)" },
		{ id: 15, name: "Pink-Purple-Blue", gradient: "linear-gradient(to right, #FF3CAC, #784BA0, #2B86C5)" }
	];


	const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
	let [isOpen, setIsOpen] = useState(false);
	const [userBackground, setUserBackground] = useState("marble");
	const [userMarbleColors, setUserMarbleColors] = useState(["#4158D0", "#C850C0", "#FFCC70"]);
	const [userSolidColor, setUserSolidColor] = useState("#FFFFFF");
	const [userForeground, setUserForeground] = useState("silhouette");
	const [userShowInitials, setUserShowInitials] = useState(false);
	const [userForegroundSilhoutteColor, setUserForegroundSilhoutteColor] = useState("#000000");
	const [userForegroundInitialsColor, setUserForegroundInitialsColor] = useState("#000000");

	const [userAvatar, setUserAvatar] = useState({
		background: "marble",
		marbleColors: "linear-gradient(to right, #4158D0, #C850C0,  #FFCC70)",
		solidColor: "#FFFFFF",
		foreground: "silhouette",
		showInitials: false,
		foregroundSilhoutteColor: "#000000",
		foregroundInitialsColor: "#000000"
	});

	const addMarbleColor = () => {
		if (userMarbleColors.length < 3) {
			setUserMarbleColors([...userMarbleColors, "#FFFFFF"]);
		}
	};

	interface UpdateMarbleColorParams {
		index: number;
		color: string;
	}

	const updateMarbleColor = ({ index, color }: UpdateMarbleColorParams): void => {
		const newColors = [...userMarbleColors];
		newColors[index] = color;
		setUserMarbleColors(newColors);
	};

	interface RemoveMarbleColorParams {
		index: number;
	}

	const removeMarbleColor = ({ index }: RemoveMarbleColorParams): void => {
		if (userMarbleColors.length > 2) {
			setUserMarbleColors(userMarbleColors.filter((_, i) => i !== index));
		}
	};

	const changeGradient = () => {
		setCurrentGradientIndex((prevIndex) => {
			const newIndex = (prevIndex + 1) % gradients.length;

			setUserAvatar((prevAvatar) => ({
				...prevAvatar,
				marbleColors: gradients[newIndex].gradient
			}));

			return newIndex;
		});
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
							<DialogTitle className="text-xl font-semibold">User Avatar Customization Settings</DialogTitle>
							<DialogBody>
								<div className="p-4 max-w-4xl mx-auto">
									<div className="flex flex-col lg:flex-row gap-6">
										{/* Left Section (Avatar Preview) */}
										<div className="flex-shrink-0 w-full lg:w-1/2 flex flex-col items-center">
											<div
												className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl"
												style={{
													background:
														userBackground === "marble"
															? `linear-gradient(to right, ${userMarbleColors.join(", ")})`
															: userSolidColor,
												}}
											>
												{userForeground === "silhouette" ? (
													<UserIcon className="w-10 h-10" style={{ color: userForegroundSilhoutteColor }} />
												) : userShowInitials ? (
													<Strong style={{ color: userForegroundInitialsColor }}>AB</Strong>
												) : null}
											</div>
											<Heading className="mt-4 text-lg">Preview</Heading>
										</div>

										{/* Right Section (Customization Options) */}
										<div className="w-full lg:w-1/2 space-y-6">
											<Subheading>Background</Subheading>
											<RadioGroup name="background" value={userBackground} onChange={setUserBackground}>
												<RadioField>
													<Radio value="marble" />
													<Label>Marble</Label>
												</RadioField>
												<div className="p-2 bg-gray-50 rounded-md w-full">
													{userMarbleColors.map((color, index) => (
														<div key={index} className="flex items-center gap-2 my-2">
															<input
																type="color"
																value={color}
																onChange={(e) => updateMarbleColor({ index, color: e.target.value })}
																className="w-10 h-10 cursor-pointer rounded-md border border-gray-100"
															/>
															{index > 1 && (
																<Button onClick={() => removeMarbleColor({ index })} plain>Remove</Button>
															)}
														</div>
													))}
													{userMarbleColors.length < 3 && (
														<Button onClick={addMarbleColor} plain>+ Add Color</Button>
													)}
												</div>
												<RadioField>
													<Radio value="solid" />
													<Label>Solid</Label>
												</RadioField>
												<div className="p-2 bg-gray-50 rounded-md w-full">
													<input
														type="color"
														value={userSolidColor}
														onChange={(e) => setUserSolidColor(e.target.value)}
														className="w-20 h-12 cursor-pointer rounded-md border border-gray-100"
													/>
												</div>
											</RadioGroup>
											<Divider soft />
											<Subheading>Foreground</Subheading>
											<RadioGroup
												name="foreground"
												value={userForeground || "none"}
												onChange={(value) => {
													setUserForeground(value === "none" ? "" : value);
													setUserShowInitials(value === "initials");
												}}
											>
												<RadioField>
													<Radio value="silhouette" />
													<Label>Silhouette</Label>
												</RadioField>
												{userForeground === "silhouette" && (
													<input
														type="color"
														value={userForegroundSilhoutteColor}
														onChange={(e) => setUserForegroundSilhoutteColor(e.target.value)}
														className="w-20 h-12 cursor-pointer rounded-md border border-gray-100 ml-6"
													/>
												)}
												<RadioField>
													<Radio value="initials" />
													<Label>Initials</Label>
												</RadioField>
												{userForeground === "initials" && (
													<input
														type="color"
														value={userForegroundInitialsColor}
														onChange={(e) => setUserForegroundInitialsColor(e.target.value)}
														className="w-20 h-12 cursor-pointer rounded-md border border-gray-100 ml-6"
													/>
												)}
												<RadioField>
													<Radio value="none" />
													<Label>None</Label>
												</RadioField>
											</RadioGroup>
										</div>
									</div>
								</div>
							</DialogBody>
							<DialogActions className="px-4 py-2">
								<Button plain onClick={() => setIsOpen(false)} >
									Cancel
								</Button>
								<Button
									onClick={() => {
										const gradientString = `linear-gradient(to right, ${userMarbleColors.join(", ")})`;

										setUserAvatar({
											background: userBackground,
											marbleColors: userBackground === "marble" ? gradientString : "",
											solidColor: userSolidColor,
											foreground: userForeground,
											showInitials: userShowInitials,
											foregroundSilhoutteColor: userForegroundSilhoutteColor,
											foregroundInitialsColor: userForegroundInitialsColor
										});

										setIsOpen(false);
									}}
								>
									Save
								</Button>

							</DialogActions>
						</Dialog>
					</div>
					<div
						className="w-80 h-80 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-105 hover:shadow-xl"
						style={{
							background: userAvatar.background === "marble" ? userAvatar.marbleColors : userAvatar.solidColor
						}}
						onClick={changeGradient}
					>
						{userAvatar.foreground === "silhouette" ? (
							<UserIcon className="w-40 h-40 drop-shadow-md" style={{ color: userAvatar.foregroundSilhoutteColor }} />
						) : userAvatar.showInitials ? (
							<Strong style={{ color: userAvatar.foregroundInitialsColor, fontSize: "8rem" }}>AB</Strong>
						) : null}
					</div>
					<Subheading className="mt-4">Preview of default user avatar</Subheading>
				</div>
			</div>
		</div>
	);
}
