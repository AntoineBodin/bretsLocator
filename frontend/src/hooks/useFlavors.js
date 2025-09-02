import { useEffect, useState } from "react";
import { fetchFlavors } from "../utils/api";

export function useFlavors() {
  const [flavors, setFlavors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchFlavors()
      .then(res => { if (mounted) setFlavors(res || []); })
      .catch(e => { if (mounted) setError(e); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { flavors, loading, error };
}