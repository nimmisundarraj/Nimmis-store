import React from "react";
import RouterComponent from "./routes/index";
import { CowBuddy } from "./characters";

const App: React.FC = () => {

  return (
    <>
      <RouterComponent />
      <CowBuddy />
    </>
  );
};

export { App };
