const MULTIPLAY_VERSION = "0.2.0";
const MULTIPLAY_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/itchy-multiplay@${MULTIPLAY_VERSION}/dist/reactnative/mobile.iife.js`;

import { useEffect, useState } from "react";

export const useLatestMultiPlayScript = () => {
  const [str, setStr] = useState<string | null>(null);
  useEffect(() => {
    fetch(MULTIPLAY_SCRIPT_URL)
      .then((res) => res.text())
      .then(setStr)
      .catch(console.error);
  }, []);

  return str;
};
