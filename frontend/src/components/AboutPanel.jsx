import React from "react";
import "../styles/main.scss";
import Credits from "./Credits";

export default function AboutPanel({
  open,
  onClose,
  title = "Trouve ta chips !",
  subtitle = "Cherchez vos chips préférées - Aidez les autres à trouver les leurs.",
  description = "Cette application repose sur la force de la communauté : chacun signale la présence ou l’absence de chips Bret’s en magasin, pour que tous sachent où se régaler sans perdre de temps.",
}) {
  const bmcHostRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const wrapper = document.getElementById("bmc-button-wrapper");
    if (wrapper && bmcHostRef.current && !bmcHostRef.current.querySelector(".bmc-button")) {
      bmcHostRef.current.appendChild(wrapper);
      wrapper.style.display = "inline-block";
      wrapper.style.transform = "scale(.85)";
      wrapper.style.transformOrigin = "left center";
    }
  }, [open]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`about-panel-overlay ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden={!open} />
      <section
        className={`about-panel ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={title}
      >
        <div className="about-panel__head">
          <div className="about-panel__title-wrap">
            <h2 className="about-panel__title">{title}</h2>
            <p className="about-panel__subtitle">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="about-panel__close">✕</button>
        </div>
        <div className="about-panel__body">
          <div className="about-panel__section">
            <p className="about-panel__text">{description}</p>
          </div>
          <div className="about-panel__section about-panel__discord">
            <div className="discord-callout">
              <div className="discord-callout__icon" aria-hidden="true">💬</div>
              <div className="discord-callout__content">
                <p className="discord-callout__text">Un bug ou une idée ? Rejoins le serveur Discord.</p>
                <a href="https://discord.gg/2dJ9zTxe3e" target="_blank" rel="noopener noreferrer" className="discord-callout__btn">Rejoindre Discord</a>
              </div>
            </div>
          </div>
          <div className="about-panel__section about-panel__donation">
            <div className="donation-callout">
              <div className="donation-callout__icon" aria-hidden="true">☕</div>
              <div className="donation-callout__content">
                <p className="donation-callout__text">Tu peux soutenir le développement et l'hébergement ici !</p>
                <div ref={bmcHostRef} className="donation-callout__bmc" />
              </div>
            </div>
          </div>
          <div className="about-panel__section about-panel__section--credits">
            <Credits />
          </div>
        </div>
      </section>
    </>
  );
}