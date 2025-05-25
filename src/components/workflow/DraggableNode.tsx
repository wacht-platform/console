import React from 'react';

interface DraggableNodeProps {
  nodeType: string;
  nodeData: Record<string, unknown>;
  className?: string;
  children: React.ReactNode;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ 
  nodeType, 
  nodeData, 
  className = '', 
  children 
}) => {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      nodeType,
      nodeData
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={className}
      draggable
      onDragStart={handleDragStart}
    >
      {children}
    </div>
  );
};

export default DraggableNode;
