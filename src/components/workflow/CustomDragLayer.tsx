import React from "react";
import { useDragLayer } from "react-dnd";
import { ItemTypes } from "./utils/workflowTypes";

// Style for the layer container
const layerStyles: React.CSSProperties = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 100,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
};

// Function to get item styles with proper transform
function getItemStyles(
  initialOffset: { x: number; y: number } | null,
  currentOffset: { x: number; y: number } | null,
) {
  if (!initialOffset || !currentOffset) {
    return {
      display: "none",
    };
  }

  const { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
    opacity: 1,
    display: "inline-block",
  };
}

// The custom drag layer component
const CustomDragLayer: React.FC = () => {
  const { itemType, isDragging, item, initialOffset, currentOffset } =
    useDragLayer((monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getClientOffset(),
      isDragging: monitor.isDragging(),
    }));

  // Don't render anything if not dragging or no item
  if (!isDragging || !item) {
    return null;
  }

  // Only render for workflow nodes
  if (itemType !== ItemTypes.WORKFLOW_NODE) {
    return null;
  }

  // Custom preview for node drag
  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        <div className="custom-drag-preview">
          <div className="drag-preview-icon">
            {/* Icon based on type */}
            {item.nodeType === "trigger" && "🔥"}
            {item.nodeType === "condition" && "⤴"}
            {item.nodeType === "action" && "⚡"}
            {item.nodeType === "transform" && "🔄"}
          </div>
          <div className="drag-preview-label">
            {item.data?.label || `New ${item.nodeType}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDragLayer;
