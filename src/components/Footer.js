import React from 'react';
import './Footer.css';
import phone from '../phone.png';
import instagram from '../instagram.png';
import logo from '../ami-logo.png';

export default function Footer({ onLogoClick }) {
  return (
    <footer className="footer">
      <div className="footer-left">
        <img
          src={logo}
          alt="AMI Logo"
          style={{height: '80px', marginBottom: '12px', cursor: 'pointer'}}
          onClick={onLogoClick}
        />
        <div className="footer-icons">
          <a href="tel:085121041720"><img src={phone} alt="Phone" style={{height: '24px'}} /></a>
          <a href="https://instagram.com/amippiutm" target="_blank" rel="noopener noreferrer"><img src={instagram} alt="Instagram" style={{height: '24px'}} /></a>
        </div>
      </div>
      <div className="footer-right">
        <div className="footer-contact-title">Contact Us</div>
        <div>Whatsapp (085121041720)</div>
        <div>Instagram (@amippiutm)</div>
      </div>
    </footer>
  );
}