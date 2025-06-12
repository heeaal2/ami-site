import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../ami-logo.png';

export default function Header({ onContactClick }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo-container">
          <Link to="/">
            <img src={logo} alt="AMI Logo" className="header-logo-bg" style={{ cursor: 'pointer' }} />
          </Link>
        </div>
        <nav className="header-nav">
          <Link to="/events" className="nav-link">Events</Link>
          <button className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer'}} onClick={onContactClick}>Contact</button>
        </nav>
      </div>
    </header>
  );
} 