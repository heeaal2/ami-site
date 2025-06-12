import React from 'react';
import './EventCard.css';

export default function EventCard({ title, date, time, location, image }) {
  return (
    <div className="event-card">
      <div className="event-card-image">
        {image && <img src={image} alt={title} />}
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