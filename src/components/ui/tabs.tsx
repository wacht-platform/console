import {
  useState,
  Fragment,
  type ReactNode,
  Children,
  isValidElement,
  useMemo,
  useCallback,
  memo,
} from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

// Interface for the Tabs component
export interface TabsProps {
  defaultIndex?: number;
  variant?: "pills" | "underline" | "contained" | "minimal";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  onChange?: (index: number) => void;
  children: ReactNode;
}

// Interface for the TabItem component
export interface TabItemProps {
  label: string | ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

// Type for tab data
type TabData = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  content: ReactNode;
};

// Optimized TabItem component
export const TabItem = memo(function TabItem() {
  // This component doesn't render anything directly
  // It's just a data container for the Tabs component
  return null;
});

// Optimized Tabs component
export function Tabs({
  defaultIndex = 0,
  variant = "pills",
  size = "md",
  fullWidth = false,
  onChange,
  children,
}: TabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  // Extract tab data from children once
    const tabData = useMemo<TabData[]>(() => {
      const tabs: TabData[] = [];

    Children.forEach(children, (child, index) => {
      if (isValidElement(child) && child.type === TabItem) {
        const {
          label,
          icon,
          disabled,
          children: content,
        } = child.props as TabItemProps;
        tabs.push({
          id: `tab-${index}`,
          label,
          icon,
          disabled,
          content,
        });
      }
    });

    return tabs;
  }, [children]);

  // Memoize the handler to prevent unnecessary re-renders
  const handleChange = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onChange?.(index);
    },
    [onChange]
  );

  // Memoize style classes
  const sizeClasses = useMemo(
    () => ({
      sm: "text-xs py-1.5 px-3",
      md: "text-sm py-2 px-4",
      lg: "text-base py-2.5 px-5",
    }),
    []
  );

  const getVariantClasses = useCallback(
    (selected: boolean) => {
      switch (variant) {
        case "pills":
          return selected
            ? "bg-white text-blue-600 shadow-md font-medium"
            : "text-gray-600 hover:text-gray-900 hover:bg-white/20";
        case "underline":
          return selected
            ? "text-blue-600 border-b-2 border-blue-600 font-medium"
            : "text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300";
        case "contained":
          return selected
            ? "bg-blue-600 text-white font-medium"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200";
        case "minimal":
          return selected
            ? "text-blue-600 font-medium"
            : "text-gray-500 hover:text-gray-700";
        default:
          return "";
      }
    },
    [variant]
  );

  const containerClasses = useMemo(() => {
    switch (variant) {
      case "pills":
        return "bg-gray-100 p-1.5 rounded-xl shadow-sm";
      case "underline":
        return "border-b border-gray-200 mb-1";
      case "contained":
        return "gap-px bg-gray-100 p-1 rounded-lg shadow-sm";
      case "minimal":
        return "gap-6";
      default:
        return "";
    }
  }, [variant]);

  // Optimized pill indicator
  const PillIndicator = useCallback(
    ({ selected }: { selected: boolean }) => {
      if (variant !== "pills") return null;

      return <div className={`pill-indicator ${selected ? "selected" : ""}`} />;
    },
    [variant]
  );

  // Memoized tab button
  const TabButton = useCallback(
    ({ item, selected }: { item: TabData; selected: boolean }) => (
      <button
        className={`
        relative flex items-center gap-2.5 font-medium outline-none transition-all duration-200
        ${sizeClasses[size]}
        ${getVariantClasses(selected)}
        ${fullWidth ? "flex-1 justify-center" : ""}
        ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${variant === "underline" ? "pb-2" : "rounded-lg"}
        focus:outline-none focus:ring-2 focus:ring-blue-500/20
      `}
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="relative z-10">{item.label}</span>
        <PillIndicator selected={selected} />
      </button>
    ),
    [sizeClasses, size, getVariantClasses, fullWidth, variant, PillIndicator]
  );

  // Memoized tab content
  const TabContent = useCallback(
    ({ content }: { content: ReactNode }) => <div>{content}</div>,
    []
  );

  // If no tabs, return null
  if (tabData.length === 0) return null;

  return (
    <TabGroup selectedIndex={selectedIndex} onChange={handleChange}>
      <TabList
        className={`flex ${containerClasses} ${fullWidth ? "w-full" : ""}`}
      >
        {tabData.map((item) => (
          <Tab as={Fragment} key={item.id} disabled={item.disabled}>
            {({ selected }) => <TabButton item={item} selected={selected} />}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabData.map((item) => (
          <TabPanel key={item.id}>
            <TabContent content={item.content} />
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
