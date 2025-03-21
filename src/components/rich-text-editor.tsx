import { useState } from "react";
import { PREVIEW_MODES } from "../utils/constants";
import type { EditorProps } from "../types/rich-text-editor";
import { Button } from "./ui/button";
import { CodeBracketIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const EmailEditor: React.FC<EditorProps> = () => {
	const [previewMode, setPreviewMode] = useState(PREVIEW_MODES[0]);
	const [showHtml] = useState(false);

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 rounded-t-lg">
				<div className="flex gap-2">
					{PREVIEW_MODES.map((mode) => (
						<Button
							outline
							key={mode.name}
							onClick={() => setPreviewMode(mode)}
							className={`${
								previewMode.name === mode.name ? "bg-gray-100" : ""
							}`}
							aria-label={`Switch to ${mode.name} mode`}
						>
							<span className="flex items-center gap-2">
								{mode.icon}
								<span className="text-sm">{mode.name}</span>
							</span>
						</Button>
					))}
				</div>

				<Button
					outline
					onClick={() => {}}
					className={`${showHtml ? "bg-gray-100" : ""}`}
					aria-label={
						showHtml ? "Switch to Rich Text Editor" : "Switch to HTML Editor"
					}
				>
					{showHtml ? (
						<DocumentTextIcon className="w-5 h-5" />
					) : (
						<CodeBracketIcon className="w-5 h-5" />
					)}
				</Button>
			</div>
		</div>
	);
};

export default EmailEditor;
