import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC<{}> = () => {
  return (
    <div className="home">
      <div className="home__menu">
        <h1>3D Playground</h1>
        <div>
          <Link to="barycentric">Barycentric Coordinates</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
