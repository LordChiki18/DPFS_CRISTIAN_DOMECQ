import React from 'react';
import TotalPanel from './components/TotalPanel';
import LastCreatedPanel from './components/LastCreatedPanel';
import CategoryBreakdown from './components/CategoryBreakdown';
import ProductList from './components/ProductList';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="column-stack">
          <TotalPanel />
          <CategoryBreakdown />
          <ProductList />
        </div>
        <LastCreatedPanel />
        
      </div>
    </div>
  );
}

export default App;
