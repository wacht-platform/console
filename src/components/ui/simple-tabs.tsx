import React, { useState, ReactNode } from "react";

interface TabProps {
  label: string;
  children: ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  children: ReactNode;
  defaultTab?: number;
}

export const SimpleTabs: React.FC<TabsProps> = ({
  children,
  defaultTab = 0,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Extract tabs from children
  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  ) as React.ReactElement<TabProps>[];

  if (tabs.length === 0) return null;

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-zinc-700">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2.5 text-sm relative font-medium ${
              activeTab === index
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            }`}
            onClick={() => setActiveTab(index)}
            style={{
              marginBottom: "-1px", // Align the border with the bottom border
            }}
          >
            {tab.props.label}
            {activeTab === index && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                style={{ bottom: "-1px" }}
              />
            )}
          </button>
        ))}
      </div>
      <div key={activeTab}>{tabs[activeTab] ? tabs[activeTab].props.children : null}</div>
    </div>
  );
};
