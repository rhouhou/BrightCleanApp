import React, { createContext, useContext, useState } from "react";

// Create a Context for the Tabs state
const TabsContext = createContext();

// Tabs root component manages current selected tab value
export function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

// TabsList: container for the tab triggers
export function TabsList({ children, className, ...props }) {
  return (
    <div role="tablist" className={className} {...props}>
      {children}
    </div>
  );
}

// TabsTrigger: individual tab button
export function TabsTrigger({
  value: tabValue,
  children,
  className,
  ...props
}) {
  const { value, setValue } = useContext(TabsContext);
  const isSelected = value === tabValue;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      onClick={() => setValue(tabValue)}
      className={`${className} ${
        isSelected
          ? "border-b-2 border-blue-600 font-semibold bg-sky-200"
          : "text-gray-500"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

// TabsContent: panel for the selected tab
export function TabsContent({
  value: panelValue,
  children,
  className,
  ...props
}) {
  const { value } = useContext(TabsContext);
  return (
    value === panelValue && (
      <div role="tabpanel" className={className} {...props}>
        {children}
      </div>
    )
  );
}
