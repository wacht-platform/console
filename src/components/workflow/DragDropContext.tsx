import React, { createContext, useState, ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DragItem, Position } from "./utils/workflowTypes";

// Define the context interface for workflow-specific state
interface WorkflowDragContextType {
  currentItem: DragItem | null;
  setCurrentItem: (item: DragItem | null) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  dropPosition: Position | null;
  setDropPosition: (position: Position | null) => void;
}

// Create the context with default values
export const WorkflowDragContext = createContext<WorkflowDragContextType>({
  currentItem: null,
  setCurrentItem: () => {},
  isDragging: false,
  setIsDragging: () => {},
  dropPosition: null,
  setDropPosition: () => {},
});

// Custom provider component
export const WorkflowDragProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentItem, setCurrentItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Update the body class when dragging state changes
  React.useEffect(() => {
    if (isDragging) {
      document.body.classList.add("dragging-workflow-node");
    } else {
      document.body.classList.remove("dragging-workflow-node");
    }

    return () => {
      document.body.classList.remove("dragging-workflow-node");
    };
  }, [isDragging]);

  return (
    <WorkflowDragContext.Provider
      value={{
        currentItem,
        setCurrentItem,
        isDragging,
        setIsDragging,
        dropPosition,
        setDropPosition,
      }}
    >
      {children}
    </WorkflowDragContext.Provider>
  );
};

// Main provider that combines React DnD provider with our custom provider
export const DragDropProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <WorkflowDragProvider>{children}</WorkflowDragProvider>
    </DndProvider>
  );
};

export default DragDropProvider;
