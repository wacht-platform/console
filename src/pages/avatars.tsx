import { useState } from "react";
import { Strong, Text } from "@/components/ui/text";
import { Label } from "@/components/ui/fieldset";
import { Radio, RadioField, RadioGroup } from "@/components/ui/radio";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { UserIcon } from "@heroicons/react/24/outline";

export function AvatarsPage() {

	const [userBackground, setUserBackground] = useState("marble");
	const [userMarbleColors, setUserMarbleColors] = useState(["#6C47FF", "#FFD600"]);
	const [userSolidColor, setUserSolidColor] = useState("#FFFFFF");
	const [userForeground, setUserForeground] = useState("silhouette");
	const [userShowInitials, setUserShowInitials] = useState(false);
	const [userforegroundSilhoutteColor, setUserForegroundSilhoutteColor] = useState("#000000");
	const [userforegroundInitialsColor, setUserForegroundInitialsColor] = useState("#000000");


	const [orgBackground, setOrgBackground] = useState("marble");
	const [orgMarbleColors, setOrgMarbleColors] = useState(["#6C47FF", "#FFD600"]);
	const [orgSolidColor, setOrgSolidColor] = useState("#FFFFFF");
	const [orgForeground, setOrgForeground] = useState("silhouette");
	const [orgShowInitials, setOrgShowInitials] = useState(false);
	const [orgforegroundSilhoutteColor, setOrgForegroundSilhoutteColor] = useState("#000000");
	const [orgforegroundInitialsColor, setOrgForegroundInitialsColor] = useState("#000000");

	interface AvatarSettingsProps {
		background: string;
		setBackground: (value: string) => void;
		marbleColors: string[];
		setMarbleColors: (colors: string[]) => void;
		solidColor: string;
		setSolidColor: (color: string) => void;
		foreground: string;
		setForeground: (value: string) => void;
		showInitials: boolean;
		setShowInitials: (value: boolean) => void;
		title: string;
		setForegroundInitialsColor: (color: string) => void;
		setForegroundSilhoutteColor: (color: string) => void;
		foregroundSilhoutteColor: string;
		foregroundInitialsColor: string;
	}

	const addMarbleColor = (setMarbleColors: (colors: string[]) => void, marbleColors: string[]): void => {
		if (marbleColors.length < 3) {
			setMarbleColors([...marbleColors, "#FFFFFF"]);
		}
	};

	const updateMarbleColor = (
		setMarbleColors: (colors: string[]) => void,
		marbleColors: string[],
		index: number,
		color: string
	): void => {
		const newColors = [...marbleColors];
		newColors[index] = color;
		setMarbleColors(newColors);
	};

	interface RemoveMarbleColorProps {
		setMarbleColors: (colors: string[]) => void;
		marbleColors: string[];
		index: number;
	}

	const removeMarbleColor = ({ setMarbleColors, marbleColors, index }: RemoveMarbleColorProps): void => {
		if (marbleColors.length > 2) {
			setMarbleColors(marbleColors.filter((_, i) => i !== index));
		}
	};

	const AvatarSettings = ({
		background,
		setBackground,
		marbleColors,
		setMarbleColors,
		solidColor,
		setSolidColor,
		foreground,
		setForeground,
		showInitials,
		setShowInitials,
		title,
		setForegroundInitialsColor,
		setForegroundSilhoutteColor,
		foregroundSilhoutteColor,
		foregroundInitialsColor,
	}: AvatarSettingsProps) => (
		<div className="flex gap-8">
			<div className="flex-shrink-0 w-1/2 flex">
				<div
					className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl"
					style={{
						background:
							background === "marble"
								? `linear-gradient(to right, ${marbleColors.join(", ")})`
								: solidColor,
					}}
				>
					{foreground === "silhouette" ? (
						<UserIcon className="w-10 h-10" style={{ color: foregroundSilhoutteColor }} />
					) : showInitials ? (
						<Strong style={{ color: foregroundInitialsColor }}>AB</Strong>
					) : null}

				</div>
			</div>
			<div className="w-1/2 space-y-6">
				<div className="space-y-1">
					<Subheading><Strong>{title}</Strong></Subheading>
					<Text>Customize the avatar settings.</Text>
				</div>
				<Subheading>Background</Subheading>
				<RadioGroup name="background" value={background} onChange={setBackground}>
					<RadioField>
						<Radio value="marble" />
						<Label>Marble</Label>
					</RadioField>
					<div className="p-2 bg-gray-50 rounded-md w-full">
						<Text>Marble gradient background.</Text>
						{marbleColors.map((color, index) => (
							<div key={index} className="flex items-center gap-2 my-2">
								<input
									type="color"
									value={color}
									onChange={(e) => updateMarbleColor(setMarbleColors, marbleColors, index, e.target.value)}
									className="w-10 h-10 cursor-pointer rounded-md border border-gray-100"
								/>
								{index > 1 && (
									<Button onClick={() => removeMarbleColor({ setMarbleColors, marbleColors, index })} plain>
										Remove
									</Button>
								)}
							</div>
						))}
						{marbleColors.length < 3 && (
							<Button onClick={() => addMarbleColor(setMarbleColors, marbleColors)} plain>
								+ Add Color
							</Button>
						)}
					</div>
					<RadioField>
						<Radio value="solid" />
						<Label>Solid</Label>
					</RadioField>
					<div className="p-2 bg-gray-50 rounded-md w-full">
						<Text>Solid color background.</Text>
						<input
							type="color"
							value={solidColor}
							onChange={(e) => setSolidColor(e.target.value)}
							className="w-20 h-12 cursor-pointer rounded-md border border-gray-100"
						/>
					</div>
				</RadioGroup>
				<Divider className="my-4" soft />
				<Subheading>Foreground</Subheading>
				<RadioGroup
					name="foreground"
					value={foreground || "none"}
					onChange={(value) => {
						setForeground(value === "none" ? "" : value);
						setShowInitials(value === "initials");
					}}
				>
					<div className="space-y-2">
						<RadioField>
							<Radio value="silhouette" />
							<Label>Silhouette</Label>
						</RadioField>
						{foreground === "silhouette" && (
							<input
								type="color"
								value={foregroundSilhoutteColor}
								onChange={(e) => setForegroundSilhoutteColor(e.target.value)}
								className="w-20 h-12 cursor-pointer rounded-md border border-gray-100 ml-6"
							/>
						)}

						<RadioField>
							<Radio value="initials" />
							<Label>Initials</Label>
						</RadioField>
						{foreground === "initials" && (
							<input
								type="color"
								value={foregroundInitialsColor}
								onChange={(e) => setForegroundInitialsColor(e.target.value)}
								className="w-20 h-12 cursor-pointer rounded-md border border-gray-100 ml-6"
							/>
						)}

						<RadioField>
							<Radio value="none" />
							<Label>None</Label>
						</RadioField>
					</div>
				</RadioGroup>

			</div>
		</div>
	);

	return (
		<>
			<div className="p-6">
				<Heading>Avatars</Heading>
				<Divider className="my-8" soft />
				<AvatarSettings
					title="Default User Avatar"
					background={userBackground}
					setBackground={setUserBackground}
					marbleColors={userMarbleColors}
					setMarbleColors={setUserMarbleColors}
					solidColor={userSolidColor}
					setSolidColor={setUserSolidColor}
					foreground={userForeground}
					setForeground={setUserForeground}
					showInitials={userShowInitials}
					setShowInitials={setUserShowInitials}
					setForegroundInitialsColor={setUserForegroundInitialsColor}
					setForegroundSilhoutteColor={setUserForegroundSilhoutteColor}
					foregroundSilhoutteColor={userforegroundSilhoutteColor}
					foregroundInitialsColor={userforegroundInitialsColor}
				/>
				<Divider className="my-8" soft />
				<AvatarSettings
					title="Default Organization Logo"
					background={orgBackground}
					setBackground={setOrgBackground}
					marbleColors={orgMarbleColors}
					setMarbleColors={setOrgMarbleColors}
					solidColor={orgSolidColor}
					setSolidColor={setOrgSolidColor}
					foreground={orgForeground}
					setForeground={setOrgForeground}
					showInitials={orgShowInitials}
					setShowInitials={setOrgShowInitials}
					setForegroundInitialsColor={setOrgForegroundInitialsColor}
					setForegroundSilhoutteColor={setOrgForegroundSilhoutteColor}
					foregroundSilhoutteColor={orgforegroundInitialsColor}
					foregroundInitialsColor={orgforegroundSilhoutteColor}
				/>
			</div>
			<Divider className="my-4" soft />
			<div className="flex justify-end gap-4">
				<Button type="reset" plain>Reset</Button>
				<Button type="submit">Save changes</Button>
			</div>
		</>
	);
}