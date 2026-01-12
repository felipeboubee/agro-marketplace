import React from "react";
import ProfileSettings from "../../components/common/ProfileSettings";

export default function BuyerSettings() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return (
      <div className="loading-container">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return <ProfileSettings user={user} />;
}
