import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar, NavbarSpacer } from "@/components/ui/navbar";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { ProjectWithDeployments } from "@/types/project";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useProjectStore } from "@/lib/store/project";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { useState } from "react";
import { UserButton, OrganizationSwitcher } from "@wacht/react-router";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectLoadingGrid } from "@/components/ui/loading-screen";
import {
  PlusIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";


export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const { data: billingAccount } = useBillingAccount();
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [billingSetupDialogOpen, setBillingSetupDialogOpen] = useState(false);
  const [pendingBillingDialogOpen, setPendingBillingDialogOpen] =
    useState(false);

  const handleCreateProject = () => {
    if (!billingAccount || billingAccount.status === "cancelled" || billingAccount.status === "failed") {
      setBillingSetupDialogOpen(true);
    } else if (billingAccount.status === "pending") {
      setPendingBillingDialogOpen(true);
    } else {
      setCreateProjectDialogOpen(true);
    }
  };

  const productionDeployments =
    projects?.filter((project) =>
      project.deployments.some(
        (deployment) => deployment.mode === "production",
      ),
    ) || [];

  const stagingDeployments =
    projects?.filter((project) =>
      project.deployments.some((deployment) => deployment.mode === "staging"),
    ) || [];

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950">
      {/* Navbar */}
      <Navbar className="fixed z-50 top-0 left-0 right-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 h-14">
        <div className="max-w-7xl mx-auto w-full flex items-center px-6 lg:px-8 h-full">
          <OrganizationSwitcher />
          <NavbarSpacer />
          <UserButton showName={false} />
        </div>
      </Navbar>

      {/* Main Content */}
      <div className="pt-14 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="py-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-normal text-neutral-900 dark:text-neutral-100 tracking-tight">
                Projects
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Oversee your applications and deployment environments.
              </p>
            </div>
            <Button
              onClick={handleCreateProject}
              className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm rounded-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New project</span>
            </Button>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="pb-20">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-8">
              <TabsList className="bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl h-10">
                <TabsTrigger
                  value="all"
                  className="px-6 h-8 text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm transition-all"
                >
                  All projects
                </TabsTrigger>
                <TabsTrigger
                  value="production"
                  className="px-6 h-8 text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm transition-all"
                >
                  Production
                </TabsTrigger>
                <TabsTrigger
                  value="staging"
                  className="px-6 h-8 text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm transition-all"
                >
                  Staging
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0 outline-none">
              {isLoading ? (
                <ProjectLoadingGrid items={6} />
              ) : projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {projects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState
                  title="No projects yet"
                  description="Create your first project to get started"
                  actionLabel="Create Project"
                  onAction={handleCreateProject}
                />
              )}
            </TabsContent>

            <TabsContent value="production" className="mt-0 outline-none">
              {isLoading ? (
                <ProjectLoadingGrid items={3} />
              ) : productionDeployments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {productionDeployments.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        highlightMode="production"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState
                  title="No production deployments"
                  description="Deploy your first production environment"
                  actionLabel="Create Project"
                  onAction={handleCreateProject}
                />
              )}
            </TabsContent>

            <TabsContent value="staging" className="mt-0 outline-none">
              {isLoading ? (
                <ProjectLoadingGrid items={3} />
              ) : stagingDeployments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {stagingDeployments.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        highlightMode="staging"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState
                  title="No staging deployments"
                  description="Create a staging environment for testing"
                  actionLabel="Create Project"
                  onAction={handleCreateProject}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onClose={() => setCreateProjectDialogOpen(false)}
      />

      <BillingSetupDialog
        open={billingSetupDialogOpen}
        onClose={() => setBillingSetupDialogOpen(false)}
        onSuccess={() => setBillingSetupDialogOpen(false)}
      />

      <Dialog
        open={pendingBillingDialogOpen}
        onClose={() => setPendingBillingDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <DialogTitle>Subscription Not Complete</DialogTitle>
            </div>
            <DialogDescription>
              <Text>
                Your billing account has been created but the subscription payment
                has not been completed yet.
              </Text>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>You closed the payment page before completing checkout</li>
                <li>The payment is still processing</li>
                <li>There was an issue with your payment method</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingBillingDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setPendingBillingDialogOpen(false);
                setBillingSetupDialogOpen(true);
              }}
            >
              Complete Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectWithDeployments;
  index: number;
  highlightMode?: "production" | "staging";
}

function ProjectCard({ project, index, highlightMode }: ProjectCardProps) {
  const navigate = useNavigate();
  const { setSelectedProject, setSelectedDeployment } = useProjectStore();
  const { name, image_url, deployments, created_at, id } = project;

  const navigateToProject = () => {
    let targetDeployment = highlightMode
      ? deployments.find((d) => d.mode === highlightMode)
      : deployments.find((d) => d.mode === "production") || deployments[0];

    if (!targetDeployment) targetDeployment = deployments[0];

    setSelectedProject(project);
    setSelectedDeployment(targetDeployment);
    navigate(`/project/${id}/deployment/${targetDeployment.id}`);
  };

  const production = deployments.find((d) => d.mode === "production");
  const staging = deployments.find((d) => d.mode === "staging");
  const primary = production || staging || deployments[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card
        onClick={navigateToProject}
        className="group relative flex flex-col h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden p-0"
      >
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6 pb-4">
          <Avatar className="w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110">
            <AvatarImage src={image_url} />
            <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800 text-lg font-normal">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {name}
            </h3>
            {primary && (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                <GlobeAltIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{primary.frontend_host}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6 pb-6 pt-0">
          <div className="flex flex-wrap gap-2 mt-2">
            {production && (
              <Badge variant="outline" className="bg-green-50/50 dark:bg-green-500/5 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-500/20 text-[10px] font-medium px-2 py-0.5">
                Production
              </Badge>
            )}
            {staging && (
              <Badge variant="outline" className="bg-blue-50/50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20 text-[10px] font-medium px-2 py-0.5">
                Staging
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>Created {format(new Date(created_at), "MMM d, yyyy")}</span>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
        </CardFooter>
      </Card>
    </motion.div>
  );
}

