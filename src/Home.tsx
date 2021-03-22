import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC<{}> = () => {
  return (
    <div>
      <h1>Demos</h1>
      <div>
        <Link to="barycentric">Barycentric Coordinates</Link>
      </div>
    </div>
  );
};

export default Home;
