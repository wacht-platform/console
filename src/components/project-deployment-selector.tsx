import { Fragment, useState } from 'react';
import * as Headless from '@headlessui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Avatar } from '@/components/ui/avatar';
import { capitalize } from '@/lib/capitalize';

interface Project {
  id: string;
  name: string;
  image_url?: string;
  deployments: Deployment[];
}

interface Deployment {
  id: string;
  name?: string;
  mode: string;
}

interface ProjectDeploymentSelectorProps {
  projects?: Project[];
  selectedProject?: Project;
  selectedDeployment?: Deployment;
  onProjectSelect: (project: Project) => void;
  onDeploymentSelect: (deployment: Deployment) => void;
  onCreateProject: () => void;
  onCreateStaging: () => void;
  onCreateProduction: () => void;
  canCreateStaging: boolean;
  canCreateProduction: boolean;
}

export function ProjectDeploymentSelector({
  projects = [],
  selectedProject,
  selectedDeployment,
  onProjectSelect,
  onDeploymentSelect,
  onCreateProject,
  onCreateStaging,
  onCreateProduction,
  canCreateStaging,
  canCreateProduction,
}: ProjectDeploymentSelectorProps) {
  // Initialize with all projects expanded
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map(p => p.id))
  );

  const toggleProjectExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectClick = (e: React.MouseEvent, project: Project, close: () => void) => {
    if (project.deployments.length > 0) {
      // Prevent menu from closing
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle expansion
      toggleProjectExpanded(project.id);
      
      // Select project and first deployment if different project
      if (selectedProject?.id !== project.id) {
        onProjectSelect(project);
        if (project.deployments.length > 0) {
          onDeploymentSelect(project.deployments[0]);
        }
      }
    } else {
      // If no deployments, select the project and close
      onProjectSelect(project);
      close();
    }
  };

  const handleDeploymentClick = (project: Project, deployment: Deployment) => {
    onProjectSelect(project);
    onDeploymentSelect(deployment);
  };

  const currentDisplay = selectedProject
    ? selectedDeployment
      ? `${selectedProject.name} / ${selectedDeployment.name || capitalize(selectedDeployment.mode)}`
      : selectedProject.name
    : "Select Project";

  return (
    <Headless.Menu as="div" className="relative">
      {() => (
        <>
          <Headless.MenuButton className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-100 border border-gray-200 dark:border-zinc-800/60 rounded-md bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            {selectedProject && (
              <Avatar
                src={selectedProject.image_url}
                initials={selectedProject.name.substring(0, 2).toUpperCase()}
                className="h-5 w-5 text-[10px]"
              />
            )}
            <span>{currentDisplay}</span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400 ml-auto" />
          </Headless.MenuButton>

          <Headless.Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Headless.MenuItems className="absolute left-0 z-50 mt-2 w-80 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/60 rounded-md shadow-sm max-h-96 overflow-y-auto">
              {() => (
                <>
                  {projects.map((project) => {
                    const isExpanded = expandedProjects.has(project.id);
                    const isProjectSelected = selectedProject?.id === project.id;
                    
                    return (
                      <div key={project.id}>
                        <Headless.MenuItem>
                          {({ active }) => (
                            <button
                              onClick={(e) => handleProjectClick(e, project, close)}
                              className={clsx(
                                active ? 'bg-gray-50 dark:bg-zinc-800' : '',
                                'w-full flex items-center px-4 py-3 text-sm transition-colors'
                              )}
                            >
                              {project.deployments.length > 0 && (
                                <ChevronRightIcon
                                  className={clsx(
                                    'h-3 w-3 mr-1 text-gray-400 transition-transform',
                                    isExpanded && 'rotate-90'
                                  )}
                                />
                              )}
                              <Avatar
                                src={project.image_url}
                                initials={project.name.substring(0, 2).toUpperCase()}
                                className="mr-2 h-5 w-5 text-[10px]"
                              />
                              <span className={clsx(
                                'flex-1 text-left',
                                isProjectSelected ? 'font-medium text-gray-900 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'
                              )}>
                                {project.name}
                              </span>
                              {project.deployments.length === 0 && isProjectSelected && (
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                              )}
                            </button>
                          )}
                        </Headless.MenuItem>

                        {isExpanded && (
                          <>
                            {project.deployments.map((deployment) => {
                              const isDeploymentSelected = selectedDeployment?.id === deployment.id;
                              
                              return (
                                <Headless.MenuItem key={deployment.id}>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDeploymentClick(project, deployment)}
                                      className={clsx(
                                        active ? 'bg-gray-50 dark:bg-zinc-800' : '',
                                        'w-full flex items-center pl-12 pr-4 py-2.5 text-sm transition-colors'
                                      )}
                                    >
                                      <div className={clsx(
                                        'h-1.5 w-1.5 rounded-full mr-2',
                                        deployment.mode === 'production' ? 'bg-green-500' : 'bg-yellow-500'
                                      )} />
                                      <span className={clsx(
                                        'flex-1 text-left',
                                        isDeploymentSelected ? 'font-medium text-gray-900 dark:text-zinc-100' : 'text-gray-600 dark:text-zinc-400'
                                      )}>
                                        {deployment.name || capitalize(deployment.mode)}
                                      </span>
                                      {isDeploymentSelected && (
                                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                                      )}
                                    </button>
                                  )}
                                </Headless.MenuItem>
                              );
                            })}

                            {isProjectSelected && (canCreateStaging || canCreateProduction) && (
                              <>
                                {canCreateStaging && (
                                  <Headless.MenuItem>
                                    {({ active }) => (
                                      <button
                                        onClick={() => onCreateStaging()}
                                        className={clsx(
                                          active ? 'bg-gray-50 dark:bg-zinc-800' : '',
                                          'w-full flex items-center pl-12 pr-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 transition-colors'
                                        )}
                                      >
                                        <PlusIcon className="mr-2 h-3 w-3" />
                                        Add staging
                                      </button>
                                    )}
                                  </Headless.MenuItem>
                                )}
                                {canCreateProduction && (
                                  <Headless.MenuItem>
                                    {({ active }) => (
                                      <button
                                        onClick={() => onCreateProduction()}
                                        className={clsx(
                                          active ? 'bg-gray-50 dark:bg-zinc-800' : '',
                                          'w-full flex items-center pl-12 pr-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 transition-colors'
                                        )}
                                      >
                                        <PlusIcon className="mr-2 h-3 w-3" />
                                        Add production
                                      </button>
                                    )}
                                  </Headless.MenuItem>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  <div className="border-t border-gray-200 dark:border-zinc-800 mt-1 pt-1">
                    <Headless.MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => onCreateProject()}
                          className={clsx(
                            active ? 'bg-gray-50 dark:bg-gray-800' : '',
                            'w-full flex items-center px-4 py-3 text-sm text-gray-600 dark:text-zinc-400 transition-colors'
                          )}
                        >
                          <div className="h-5 w-5 rounded-full border border-dashed border-gray-400 flex items-center justify-center mr-2">
                            <PlusIcon className="h-3 w-3" />
                          </div>
                          Create new project
                        </button>
                      )}
                    </Headless.MenuItem>
                  </div>
                </>
              )}
            </Headless.MenuItems>
          </Headless.Transition>
        </>
      )}
    </Headless.Menu>
  );
}