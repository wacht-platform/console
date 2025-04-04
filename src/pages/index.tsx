import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export default function Home() {
	const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
		useState(false);

	return (
		<div className="p-10 max-w-7xl mx-auto flex flex-col justify-center items-center min-h-screen">
			<h1 className="text-2xl font-bold mb-8">Authentication Form Builder</h1>
			<p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-2xl text-center">
				Design and customize your authentication experience with our visual
				builder. Select the authentication methods you want to support and see a
				live preview of your sign-in form.
			</p>

			<Button
				onClick={() => setIsCreateProjectDialogOpen(true)}
				color="blue"
				className="px-6 py-3"
			>
				Design Authentication Experience
			</Button>

			<CreateProjectDialog
				open={isCreateProjectDialogOpen}
				onClose={() => setIsCreateProjectDialogOpen(false)}
			/>
		</div>
	);
}
