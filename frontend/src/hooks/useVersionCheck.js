import { useState, useEffect } from "react";
import CHANGELOG from "../config/changelog";

/**
 * Mostra o changelog uma vez por versão, na primeira vez após o login.
 * A chave no localStorage inclui o email do usuário para ser por conta.
 */
export function useVersionCheck() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user?.email || "guest";
      const key = `changelog_seen_${email}_${CHANGELOG.version}`;

      if (!localStorage.getItem(key)) {
        setShow(true);
        localStorage.setItem(key, "1");
      }
    } catch {
      // silencioso
    }
  }, []);

  function dismiss() {
    setShow(false);
  }

  return { show, dismiss };
}
