import {
	ComputerDesktopIcon,
	DevicePhoneMobileIcon,
	DeviceTabletIcon,
} from "@heroicons/react/24/outline";

export const DYNAMIC_VARIABLES: Record<string, string> = {
	action_url: "https://example.com/action",
	"app.domain_name": "example.com",
	"app.logo_image_url": "https://example.com/logo.png",
	"app.name": "My App",
	"app.url": "https://example.com",
	"invitation.expires_in_days": "7",
	"invitation.public_metadata": "{}",
	inviter_name: "John Doe",
};

export const PREVIEW_MODES = [
	{
		name: "Desktop",
		width: "100%",
		icon: <ComputerDesktopIcon className="w-5 h-5" />,
	},
	{
		name: "Tablet",
		width: "768px",
		icon: <DeviceTabletIcon className="w-5 h-5" />,
	},
	{
		name: "Mobile",
		width: "375px",
		icon: <DevicePhoneMobileIcon className="w-5 h-5" />,
	},
];

export const TINYMCE_CONFIG = {
	height: 500,
	menubar: false,
	plugins: [
		"advlist",
		"autolink",
		"lists",
		"link",
		"image",
		"charmap",
		"preview",
		"anchor",
		"searchreplace",
		"visualblocks",
		"code",
		"fullscreen",
		"insertdatetime",
		"media",
		"table",
		"code",
		"wordcount",
	],
	toolbar:
		"undo redo | blocks | " +
		"bold italic forecolor | alignleft aligncenter " +
		"alignright alignjustify | bullist numlist outdent indent | " +
		"removeformat | variables ",
	content_style:
		"body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
	valid_elements: "*[*]",
	forced_root_block: false,
	extended_valid_elements: "div[style|class|id]",
};
