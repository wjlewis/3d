import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import BarycentricDemo from './BarycentricDemo';
import TrianglesDemo from './TrianglesDemo';
import Home from './Home';

const App: React.FC<{}> = () => {
  return (
    <Router>
      <Switch>
        <Route path="/barycentric">
          <BarycentricDemo />
        </Route>

        <Route path="/triangles">
          <TrianglesDemo />
        </Route>

        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
