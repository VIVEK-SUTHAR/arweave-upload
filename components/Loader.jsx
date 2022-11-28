import React, { useEffect } from "react";
import styles from "../styles/loader.module.css";
function Loader({ message }) {
  
  return (
    <div className={styles.loader_container}>
          <span class={styles.loader}></span>
          {message}

    </div>
  );
}

export default Loader;
