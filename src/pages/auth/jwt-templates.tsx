import { Heading } from "@/components/ui/heading";
import { DeploymentJWTTemplate } from "@/types/deployment";
import { useNavigate } from "react-router";
import { PlusIcon, KeyIcon, ClockIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { useDeploymentJWTTemplates } from "@/lib/api/hooks/use-deployment-jwt-templates";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const JWTTemplateCard = ({
  template,
}: {
  template: DeploymentJWTTemplate;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`./edit/${template.id}`);
  };

  return (
    <div
      className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <KeyIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-normal text-gray-900 group-hover:text-indigo-600 transition-colors">
              {template.name}
            </h3>
            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-3.5 w-3.5 mr-1" />
                <span>{template.token_lifetime}s lifetime</span>
              </div>
              {template.custom_signing_key?.enabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Custom Key
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Updated {formatDistanceToNow(new Date(template.updated_at))} ago
      </div>
    </div>
  );
};

export default function JWTTemplatesPage() {
  const { jwtTemplates, isLoadingJWTTemplates } = useDeploymentJWTTemplates();
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate("./new");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <Heading className="text-2xl font-normal text-gray-900">
              JWT Templates
            </Heading>
            <p className="mt-1 text-sm text-gray-600">
              Manage JSON Web Token templates for secure authentication
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {isLoadingJWTTemplates ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading templates...</span>
          </div>
        </div>
      ) : !jwtTemplates || jwtTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-normal text-gray-900">
            No JWT templates
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first JWT template.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreateNew}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jwtTemplates.map((template) => (
            <JWTTemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
