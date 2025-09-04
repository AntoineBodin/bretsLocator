import React from "react";
import "../styles/main.scss";

export default function Credits({
  appName = "Trouve ta chips",
  year = new Date().getFullYear(),
  devName = "Antoine Bodin",
  donateUrl = "https://buymeacoffee.com/antoinebodin",
  siteUrl
}) {
  return (
    <aside className="credits-box" aria-label="Crédits">
      <div className="credits-box__line">
        <span className="credits-box__strong">{appName}</span> © {year} – non affilié à Bret's
      </div>
      <div className="credits-box__line credits-box__line--dev">
        <span className="credits-box__strong">Développement :</span>{' '}
        <a href={donateUrl} target="_blank" rel="noopener noreferrer" className="credits-box__dev-link" title="Soutenir">
          {devName}
        </a>
      </div>
      <div className="credits-box__line">
        <span className="credits-box__strong">Données :</span> La communauté
      </div>
      {siteUrl && (
        <div className="credits-box__line">
          <span className="credits-box__strong">Site :</span>{' '}
          <a href={siteUrl} target="_blank" rel="noopener noreferrer">
            {siteUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}
    </aside>
  );
}