import { useState } from "react";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ContextManager, ContextManagerAPI } from "@snipextt/wacht";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useAgentToken } from "@/lib/hooks/use-agent-token";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api/client";

export function AgentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedDeployment } = useProjects();
  const { getAgentToken } = useAgentToken();

  // Context API implementation
  const contextAPI: ContextManagerAPI = {
    async listContexts(options) {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());
      if (options?.status) params.append("status", options.status);
      if (options?.context_group)
        params.append("context_group", options.context_group);
      if (options?.search) params.append("search", options.search);

      const queryString = params.toString();
      const url = `/ai-execution-context${queryString ? `?${queryString}` : ""}`;

      const response = await apiClient.get(url);
      return response.data;
    },

    async createContext(request) {
      const response = await apiClient.post("/ai-execution-context", request);
      return response.data;
    },
  };

  if (!selectedDeployment) {
    return null;
  }

  return (
    <>
      {/* Floating circular button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <SparklesIcon className="h-6 w-6" />
        )}
      </motion.button>

      {/* Agent panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.3,
            }}
            className="fixed bottom-24 right-6 w-[380px] h-[calc(90vh-4rem)] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-40 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-purple-600" />
                AI Assistant
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContextManager
                api={contextAPI}
                agentName="DART Analyzer - DARTBundle_0806_0832_Atul"
                onTokenNeeded={getAgentToken}
                platformAdapter={{
                  onPlatformEvent: (eventName, eventData) => {
                    console.log("Platform event:", eventName, eventData);
                  },
                  onPlatformFunction: async (
                    functionName,
                    parameters,
                    executionId,
                  ) => {
                    console.log(functionName, parameters, executionId);
                    return { error: "Unknown function" };
                  },
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
