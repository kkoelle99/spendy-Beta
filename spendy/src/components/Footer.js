import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import styles from "../styles/Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.info}>
        <p>&copy; {new Date().getFullYear()} Spendy. Smart. Secure. Simple.</p>
        <Link to="/about">About Us</Link> |{" "}
        <Link to="/privacy-policy">Privacy Policy</Link> |{" "}
        <Link to="/terms">Terms of Service</Link>
      </div>
      <div className={styles.social}>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFacebook className={styles.icon} />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter className={styles.icon} />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram className={styles.icon} />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedin className={styles.icon} />
        </a>
      </div>
      <div className={styles.contact}>
        <p>
          Contact us:{" "}
          <a href="kkoelle@alumni.fullsail.edu">support@spendy.com</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
