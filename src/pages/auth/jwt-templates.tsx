import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { DeploymentJWTTemplate } from "@/types/deployment";
import { useNavigate } from "react-router";
import { PlusIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { useDeploymentJWTTemplates } from "@/lib/api/hooks/use-deployment-jwt-templates";

const JWTTemplateCard = ({
  template,
}: {
  template?: DeploymentJWTTemplate;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (template) {
      navigate(`./edit/${template.id}`);
    } else {
      navigate("./new");
    }
  };

  if (!template) {
    return (
      <Card className="border-slate-200 cursor-pointer" onClick={handleClick}>
        <CardContent className="my-6 pb-0 gap-2 flex flex-col items-center justify-between">
          <PlusIcon className="w-7 h-7" />
          <span>New Template</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 cursor-pointer" onClick={handleClick}>
      <CardHeader>
        <CardTitle className="font-normal">{template.name}</CardTitle>
      </CardHeader>
      <CardFooter>
        Updated {formatDistanceToNow(new Date(template.updated_at))}
      </CardFooter>
    </Card>
  );
};

export default function JWTTemplatesPage() {
  const { jwtTemplates, isLoadingJWTTemplates } = useDeploymentJWTTemplates();

  if (isLoadingJWTTemplates) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Heading>JWT Templates</Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-5 pt-6">
        <JWTTemplateCard />
        {jwtTemplates?.map((template) => (
          <JWTTemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
