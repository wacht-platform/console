import type { Deployment } from "./deployment";

export type ProjectWithDeployments = {
	id: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	name: string;
	image_url: string;
	deployments: Deployment[];
};
