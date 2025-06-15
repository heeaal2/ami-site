import React, { useState } from 'react';
import './EventCard.css';

export default function EventCard({ title, date, time, location, image }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Default fallback image (you can replace with your own)
  const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='360' viewBox='0 0 280 360'%3E%3Crect width='280' height='360' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%23666'%3EEvent Image%3C/text%3E%3C/svg%3E";

  return (
    <div className="event-card">
      <div className="event-card-image">
        {imageLoading && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        {image && !imageError ? (
          <img 
            src={image} 
            alt={title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        ) : (
          <img 
            src={fallbackImage} 
            alt={title}
            onLoad={handleImageLoad}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        )}
      </div>
      <div className="event-card-gradient"></div>
      <div className="event-card-content">
        <div className="event-card-title">{title}</div>
        <div className="event-card-details">
          <div className="event-card-date-location">
            <div>{date}</div>
            {location && <div>{location}</div>}
          </div>
          <div className="event-card-time">{time}</div>
        </div>
      </div>
    </div>
  );
}