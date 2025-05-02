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
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-6 py-2.5 font-medium text-sm relative ${
              activeTab === index
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(index)}
            style={{
              marginBottom: "-1px", // Align the border with the bottom border
            }}
          >
            {tab.props.label}
            {activeTab === index && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                style={{ bottom: "-1px" }}
              />
            )}
          </button>
        ))}
      </div>
      <div>{tabs[activeTab] ? tabs[activeTab].props.children : null}</div>
    </div>
  );
};
