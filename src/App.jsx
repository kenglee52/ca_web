import React from 'react';
import AppRoute from './routes/AppRoute';
import ErrorBoundary from './ErrorBoundary';

import { Toaster } from "sonner";
const App = () => {
  return (
    <ErrorBoundary>
      <AppRoute />
       <Toaster /> 
    </ErrorBoundary>
  );
};
//dkdkd
export default App;